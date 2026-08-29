"use client";

import { useEffect, useRef, useState } from "react";

interface PatientHit {
  id: string;
  full_name: string;
  patient_code: string;
  phone: string | null;
}

/**
 * UC-09 patient selector — debounced lookup against /api/patients/search.
 * Keeps only identification fields client-side (no full records).
 */
export function PatientSearchCombobox({
  name = "patientId",
  preselectedId,
  preselectedLabel,
}: {
  name?: string;
  preselectedId?: string;
  preselectedLabel?: string;
}): React.ReactElement {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<{ key: string; hits: PatientHit[] | null; error: boolean }>({
    key: "",
    hits: null,
    error: false,
  });
  const [chosen, setChosen] = useState<PatientHit | null>(
    preselectedId
      ? { id: preselectedId, full_name: preselectedLabel ?? "Selected patient", patient_code: "", phone: null }
      : null,
  );
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim().replace(/[%_,()]/g, "");
  const searchKey = trimmed.length >= 2 ? trimmed.toLowerCase() : "";
  const stale = state.key !== searchKey;

  useEffect(() => {
    if (chosen || searchKey === "") return;
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/patients/search?q=${encodeURIComponent(searchKey)}`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(String(res.status));
          return (await res.json()) as { results: PatientHit[] };
        })
        .then((body) => {
          if (cancelled) return;
          setState({ key: searchKey, hits: body.results, error: false });
          setOpen(true);
        })
        .catch((err: unknown) => {
          if (cancelled || (err as Error).name === "AbortError") return;
          setState({ key: searchKey, hits: [], error: true });
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchKey, chosen]);

  // Close the dropdown on outside clicks.
  useEffect(() => {
    const onClick = (event: MouseEvent): void => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (chosen) {
    return (
      <div className="flex items-center justify-between rounded-sm border border-navy-light bg-navy-tint px-4 py-3">
        <span className="text-sm font-semibold text-navy">
          {chosen.full_name}
          {chosen.patient_code && (
            <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs font-bold">
              {chosen.patient_code}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => {
            setChosen(null);
            setQuery("");
            setState({ key: "", hits: null, error: false });
          }}
          className="text-xs font-medium text-navy underline underline-offset-2 focus-visible:outline-none"
        >
          Change
        </button>
        <input type="hidden" name={name} value={chosen.id} />
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => !stale && state.hits && setOpen(true)}
        placeholder="Type a name, code (P-0198) or phone…"
        aria-label="Search for the patient"
        autoComplete="off"
        className="block w-full rounded-sm border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-navy-light focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-navy-light"
      />
      {open && !stale && state.hits && state.hits.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full list-none overflow-auto rounded-sm border border-gray-200 bg-white p-0 shadow-lg">
          {state.hits.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                onClick={() => {
                  setChosen(hit);
                  setOpen(false);
                }}
                className="block w-full px-4 py-2.5 text-left text-sm text-gray-800 transition-colors hover:bg-navy-tint focus-visible:bg-navy-tint focus-visible:outline-none"
              >
                <span className="font-medium">{hit.full_name}</span>
                <span className="ml-2 rounded-full bg-navy-tint px-2 py-0.5 text-xs font-bold text-navy">
                  {hit.patient_code}
                </span>
                {hit.phone && <span className="ml-2 text-xs text-gray-500">{hit.phone}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !stale && state.hits !== null && state.hits.length === 0 && (
        <p className="mt-1 text-sm text-gray-500">No patients match — check the spelling or register them first.</p>
      )}
      <p className="mt-1.5 text-xs text-gray-500">
        Type at least 2 characters to search the register.
      </p>
    </div>
  );
}
