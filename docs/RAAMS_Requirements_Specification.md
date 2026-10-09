<div align="center">

**HiLCoE**
**School of Computer Science and Technology**

# PATIENT RECORD AND APPOINTMENT MANAGEMENT SYSTEM FOR ADDIS ABABA PRIVATE CLINICS

### SOFTWARE REQUIREMENTS ANALYSIS AND SPECIFICATION DOCUMENT

**Prepared by:**<br>
HAFSA BEDIR<br>
NEJAT MULUGETA<br>
SUMEYA ABDULJAWAD<br>
YASMIN TIKUYE

*A Senior Project Document submitted to the Undergraduate Programme Office in partial fulfillment of the requirements for the degree of Bachelor of Science in Computer Science*

**Advisor:** Dr. Tilahun Y.

**August 2026**

</div>

---

## Table of Contents

- [Table of Contents](#table-of-contents)
- [List of Figures](#list-of-figures)
- [List of Tables](#list-of-tables)
- [Definitions, Acronyms, and Abbreviations](#definitions-acronyms-and-abbreviations)
- [1. Introduction / Overview](#1-introduction--overview)
- [2. Current System](#2-current-system)
- [3. Proposed System](#3-proposed-system)
  - [3.1. Function Definition](#31-function-definition)
  - [3.2. Functional Requirements](#32-functional-requirements)
  - [3.3. Non-Functional Requirements](#33-non-functional-requirements)
  - [3.4. The Proposed System Models](#34-the-proposed-system-models)
    - [3.4.1. Scenarios](#341-scenarios)
    - [3.4.2. Use Case Diagram](#342-use-case-diagram)
    - [3.4.3. Use Case Descriptions](#343-use-case-descriptions)
    - [3.4.4. Dynamic Model (Activity Diagrams)](#344-dynamic-model-activity-diagrams)
    - [3.4.5. Object Model (Class Diagram)](#345-object-model-class-diagram)
- [4. User Interface](#4-user-interface)
- [5. References](#5-references)
- [6. Annexes](#6-annexes)
  - [6.1. Data Collection Methods/Tools](#61-data-collection-methodstools)
    - [6.1.1. Interview Questions](#611-interview-questions)
    - [6.1.2. Questionnaire Questions](#612-questionnaire-questions)

---

## List of Figures

| Figure | Title |
|---|---|
| Figure 1 | User Management & Access Control Subsystem – Use Case Diagram |
| Figure 2 | Patient Record Management Subsystem – Use Case Diagram |
| Figure 3 | Appointment Scheduling & Reporting Subsystem – Use Case Diagram |
| Figure 4 | Activity Diagram for 'Login' Use Case |
| Figure 5 | Activity Diagram for 'Register New Patient' Use Case |
| Figure 6 | Activity Diagram for 'Schedule Appointment' Use Case |
| Figure 7 | Activity Diagram for 'Generate Administrative Report' Use Case |
| Figure 8 | Class Diagram for the Patient Record and Appointment Management System |
| Figure 9 | Navigational Flow Diagram |
| Figure 10 | Login Screen — Low-Fidelity Mock-up |
| Figure 11 | Patient Registration Screen — Low-Fidelity Mock-up |
| Figure 12 | Patient Search & Record View — Low-Fidelity Mock-up |
| Figure 13 | Appointment Booking Screen — Low-Fidelity Mock-up |

## List of Tables

| Table | Title |
|---|---|
| Table 1 | Functional Requirements |
| Table 2 | Non-Functional Requirements |
| Table 3 | Scenario 001 - Patient Registration and Appointment Booking |
| Table 4 | Scenario 002 - Consultation and Medical Record Update |
| Table 5 | Scenario 003 - Administrative Reporting and Staff Account Management |
| Table 6 | Scenario 004 - Unauthorized Access Attempt |
| Table 7 | Use Case UC-01 – Login |
| Table 8 | Use Case UC-02 – Manage Staff Accounts |
| Table 9 | Use Case UC-03 – Configure Role-Based Access Permissions |
| Table 10 | Use Case UC-04 – Register New Patient |
| Table 11 | Use Case UC-05 – Update Patient Demographic Information |
| Table 12 | Use Case UC-06 – Search / Retrieve Patient Record |
| Table 13 | Use Case UC-07 – Add Medical Record Entry |
| Table 14 | Use Case UC-08 – View Medical History |
| Table 15 | Use Case UC-09 – Schedule Appointment |
| Table 16 | Use Case UC-10 – Reschedule / Cancel Appointment |
| Table 17 | Use Case UC-11 – View Appointment Calendar |
| Table 18 | Use Case UC-12 – Generate Administrative Report |
| Table 19 | Planned User Interface Screens |

## Definitions, Acronyms, and Abbreviations

| Term | Definition |
|---|---|
| **PRAAMS** | Patient Record and Appointment Management System — the short name used by the project team to refer to this system throughout the documentation. |
| **SRS** | Software/System Requirements Specification — the type of document this file represents. |
| **HiLCoE** | Institution offering this Senior Project (HiLCoE School of Computer Science and Technology). |
| **UI** | User Interface. |
| **FR** | Functional Requirement — a statement of something the system must do. |
| **NFR** | Non-Functional Requirement — a constraint on how the system must perform (e.g., speed, security). |
| **UC** | Use Case — a description of an interaction between an actor and the system to achieve a goal. |
| **RBAC** | Role-Based Access Control — restricting system access based on a user's assigned role. |
| **RLS** | Row-Level Security — a PostgreSQL/Supabase feature that restricts which rows a user can read or write at the database level. |
| **UUID** | Universally Unique Identifier — used as the primary key format for database records. |
| **API** | Application Programming Interface. |
| **TLS** | Transport Layer Security — the protocol used to encrypt data in transit. |
| **CRUD** | Create, Read, Update, Delete — the four basic operations performed on stored data. |
| **UAT** | User Acceptance Testing — testing performed with actual clinic staff to validate the system meets their needs. |

---

## 1. Introduction / Overview

This document is the Software/System Requirements Analysis and Specification Document for the Patient Record and Appointment Management System for Addis Ababa Private Clinics ("PRAAMS"). It builds directly on the Senior Project Proposal Document submitted and approved earlier, and documents the results of the requirements elicitation and analysis activities carried out since then, including a review of the current manual process used by private clinics and structured discussions with clinic staff.

This document completely describes the proposed system in terms of its functional requirements, non-functional requirements, and analysis-level models (scenarios, use case diagram, use case descriptions, an object model, and a dynamic model), following the Object-Oriented Software Engineering (OOSE) approach recommended by the School. It also presents low-fidelity mock-ups of the planned user interface and the navigational paths between screens. Together, these define the boundary and behavior of the system that will be built during the design and implementation phases.

## 2. Current System

Most private clinics in Addis Ababa currently manage patient information and appointments through manual, paper-based processes. Patient details, medical histories, and visit notes are recorded in physical files and handwritten registers, while appointments are coordinated informally, typically over the phone or through in-person requests logged in a notebook.

This manual approach presents several recurring problems that directly motivate the proposed system:

- **Retrieval delays:** locating a specific patient's file among hundreds of physical records is slow, particularly during peak hours.
- **Loss and damage:** paper files can be misplaced, damaged, or duplicated, sometimes forcing patients to repeat examinations or tests.
- **Scheduling conflicts:** without a shared, real-time view of availability, appointments are occasionally double-booked or forgotten, leading to long patient waiting times.
- **Data quality issues:** handwritten entries are prone to illegible handwriting, incomplete information, and duplicate records.
- **Limited security:** physical files offer little protection against unauthorized viewing, and there is no reliable audit trail of who accessed or modified a record.
- **Reporting difficulty:** compiling statistics for clinic management or regulatory purposes requires manually counting and cross-referencing paper records, which is time-consuming and error-prone.

These limitations directly informed the functional and non-functional requirements defined in the sections that follow.

## 3. Proposed System

The proposed Patient Record and Appointment Management System replaces the manual process described above with a centralized, role-based web application that digitizes patient registration, medical record-keeping, and appointment scheduling for private clinics in Addis Ababa.

### 3.1. Function Definition

At a high level, the proposed system performs the following core functions:

- **Patient registration** — capturing and storing new patients' demographic and contact information.
- **Electronic patient record management** — creating, updating, and securely storing patients' medical histories in a centralized database.
- **Appointment scheduling and rescheduling** — allowing staff to book, modify, and cancel appointments against real-time healthcare professional availability.
- **Patient record retrieval** — enabling authorized staff to quickly search for and access patient records.
- **Report generation** — producing administrative reports on registrations, appointments, and staff activity.
- **Role-based user authentication and access control** — verifying staff identity and restricting system functions and data according to assigned role.

Each function is described further, from its input/process/output/precondition/postcondition perspective, in the use case descriptions of Section 3.4.3.

### 3.2. Functional Requirements

Table 1 lists the functional requirements of the system, grouped by subsystem. Each is phrased as "the system shall provide/do," in line with the documentation guideline.

**Table 1: Functional Requirements**

| ID | Requirement |
|---|---|
| **User Management & Access Control** | |
| FR-01 | The system shall allow an Administrator to create, update, deactivate, and delete staff user accounts (Receptionist, Healthcare Professional, Administrator roles). |
| FR-02 | The system shall authenticate users via registered email and password before granting access to any system function. |
| FR-03 | The system shall restrict each user's access to system functions and data strictly according to their assigned role. |
| FR-04 | The system shall allow an Administrator to configure and modify role-based access permissions. |
| FR-05 | The system shall automatically terminate a user session after a defined period of inactivity. |
| **Patient Record Management** | |
| FR-06 | The system shall allow a Receptionist to register a new patient by capturing demographic and contact information. |
| FR-07 | The system shall check for potential duplicate patient records during registration, based on full name, phone number, and date of birth. |
| FR-08 | The system shall allow authorized users to update existing patient demographic information. |
| FR-09 | The system shall allow authorized users to search for and retrieve patient records by name, patient ID, or phone number. |
| FR-10 | The system shall allow a Healthcare Professional to add medical record entries (diagnosis, notes, visit date) to a patient's file. |
| FR-11 | The system shall allow a Healthcare Professional to view a patient's complete medical history in chronological order. |
| FR-12 | The system shall maintain a permanent, non-editable audit log of changes made to a patient's medical record. |
| **Appointment Scheduling & Reporting** | |
| FR-13 | The system shall allow a Receptionist to schedule an appointment for a patient with an available healthcare professional. |
| FR-14 | The system shall display real-time available time slots for each healthcare professional. |
| FR-15 | The system shall prevent double-booking of the same time slot for a healthcare professional. |
| FR-16 | The system shall allow a Receptionist to reschedule or cancel an existing appointment. |
| FR-17 | The system shall allow Receptionists and Healthcare Professionals to view a calendar of scheduled appointments. |
| FR-18 | The system shall allow an Administrator to generate reports on patient registrations, appointment statistics, and staff activity within a specified date range. |
| FR-19 | The system shall allow generated reports to be viewed on-screen, printed, or exported (e.g., as PDF/CSV). |

### 3.3. Non-Functional Requirements

Table 2 lists the non-functional requirements that constrain how the system must perform its functions. These are described only in relation to this system's context, as required by the documentation guideline.

**Table 2: Non-Functional Requirements**

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Performance | The system shall retrieve and display a patient record within 3 seconds under normal network conditions. |
| NFR-02 | Security | All sensitive patient data shall be encrypted in transit (TLS) and at rest. |
| NFR-03 | Security | User passwords shall be stored using a strong one-way hashing algorithm; plaintext passwords shall never be stored or logged. |
| NFR-04 | Availability | The system shall be operational at least 99% of the time during clinic operating hours. |
| NFR-05 | Usability | The interface shall be intuitive enough that a receptionist with basic computer literacy can register a patient after a short orientation, without formal technical training. |
| NFR-06 | Reliability | The system shall not lose data already committed to the database in the event of a browser crash or temporary network interruption. |
| NFR-07 | Maintainability | The system shall be built using modular components to simplify future maintenance, debugging, and feature additions. |
| NFR-08 | Scalability | The database design shall support continued growth in patient and appointment records without significant degradation in performance. |
| NFR-09 | Compliance | The system shall comply with applicable Ethiopian data protection requirements regarding the handling of personal and medical information. |
| NFR-10 | Auditability | The system shall record an audit trail of key actions, including login attempts, record edits, and access to patient files, for accountability. |
### 3.4. The Proposed System Models

This section documents the requirements elicitation and analysis models of the new system using the OOSE approach: scenarios, a use case diagram, detailed use case descriptions, a dynamic model (activity diagrams), and an object model (class diagram).

#### 3.4.1. Scenarios

The following scenarios illustrate typical end-to-end interactions with the proposed system.

**Table 3: Scenario 001 - Patient Registration and Appointment Booking**

> A new patient walks into a private clinic in Addis Ababa seeking a consultation. The receptionist searches the system and confirms no existing record exists for the patient. The receptionist registers the patient by entering their demographic and contact details, after which the system generates a unique patient ID. The receptionist then selects an available healthcare professional and time slot, enters the reason for the visit, and confirms the appointment. The system creates the appointment record and displays a confirmation, which the receptionist relays to the patient.

**Table 4: Scenario 002 - Consultation and Medical Record Update**

> A healthcare professional begins a scheduled consultation by searching for and opening the patient's record. The system displays the patient's full medical history in chronological order, allowing the professional to review past diagnoses and treatments. After the consultation, the professional adds a new medical record entry documenting the diagnosis, clinical notes, and visit date. The entry is saved and permanently attached to the patient's history, timestamped and linked to the professional's identity for accountability.

**Table 5: Scenario 003 - Administrative Reporting and Staff Account Management**

> At the end of the month, the clinic administrator logs into the system to review operational performance. The administrator generates a report summarizing patient registrations and appointment statistics for the month, which is used in a management meeting. Separately, the administrator creates a new user account for a recently hired receptionist, assigning the appropriate role so that the new staff member can immediately begin registering patients and scheduling appointments under the correct access permissions.

**Table 6: Scenario 004 - Unauthorized Access Attempt**

> A receptionist, while logged into the system, attempts to access the administrative reporting module out of curiosity. Because the receptionist role does not include permission to view administrative reports, the system blocks the request and displays an access-denied message. The attempted access is recorded in the system's audit log, which the administrator can later review as part of routine security monitoring.

#### 3.4.2. Use Case Diagram

The system's use cases are organized into three subsystems, each modeled as a separate use case diagram for clarity: User Management & Access Control, Patient Record Management, and Appointment Scheduling & Reporting.

![](diagrams/uc1_user_mgmt.png)

*Figure 1: User Management & Access Control Subsystem – Use Case Diagram*

![](diagrams/uc2_patient_record.png)

*Figure 2: Patient Record Management Subsystem – Use Case Diagram*

![](diagrams/uc3_appointment.png)

*Figure 3: Appointment Scheduling & Reporting Subsystem – Use Case Diagram*

#### 3.4.3. Use Case Descriptions

Tables 7 through 18 provide detailed descriptions of each use case identified in the diagrams above, including actors, preconditions, basic and alternative courses of action, and postconditions.

**Table 7: Use Case UC-01 – Login**

| Field | Detail |
|---|---|
| **Actor(s)** | Receptionist, Healthcare Professional, Administrator |
| **Description** | Allows a registered staff member to authenticate into the system using their email and password. |
| **Precondition** | The user has a valid, active account in the system. |
| **Basic Course of Action** | 1. User navigates to the login page.<br>2. User enters their registered email and password.<br>3. User submits the login form.<br>4. System validates the credentials against stored account records.<br>5. System identifies the user's role and redirects them to the corresponding dashboard. |
| **Alternative Course of Action** | 4a. If credentials are invalid, the system displays an error message and prompts the user to retry.<br>4b. After 5 consecutive failed attempts, the system temporarily locks the account for security. |
| **Postcondition** | The user is authenticated and redirected to their role-specific dashboard. |

**Table 8: Use Case UC-02 – Manage Staff Accounts**

| Field | Detail |
|---|---|
| **Actor(s)** | Administrator |
| **Description** | Allows the administrator to create, update, or deactivate staff user accounts. |
| **Precondition** | Administrator is logged in. |
| **Basic Course of Action** | 1. Administrator navigates to the User Management module.<br>2. Administrator selects "Add New Staff" or selects an existing account to edit.<br>3. Administrator enters or updates staff details (name, email, role, phone).<br>4. Administrator submits the form.<br>5. System validates and saves the account information. |
| **Alternative Course of Action** | 4a. If the email address is already registered, the system displays a duplicate-account error and prevents submission. |
| **Postcondition** | The staff account is created, updated, or deactivated in the system. |

**Table 9: Use Case UC-03 – Configure Role-Based Access Permissions**

| Field | Detail |
|---|---|
| **Actor(s)** | Administrator |
| **Description** | Allows the administrator to define which system functions each role is permitted to access. |
| **Precondition** | Administrator is logged in. |
| **Basic Course of Action** | 1. Administrator navigates to Access Control Settings.<br>2. Administrator selects a role (Receptionist, Healthcare Professional).<br>3. Administrator enables or disables specific permissions for that role.<br>4. Administrator saves the changes.<br>5. System applies the updated permission set to all users assigned that role. |
| **Alternative Course of Action** | N/A |
| **Postcondition** | Role permissions are updated and enforced system-wide. |

**Table 10: Use Case UC-04 – Register New Patient**

| Field | Detail |
|---|---|
| **Actor(s)** | Receptionist |
| **Description** | Allows the receptionist to create a new patient record in the system. |
| **Precondition** | Receptionist is logged in. |
| **Basic Course of Action** | 1. Receptionist selects "Register New Patient".<br>2. Receptionist enters the patient's demographic and contact information.<br>3. Receptionist submits the form.<br>4. System checks for potential duplicate records.<br>5. System creates the patient record and generates a unique patient ID.<br>6. System displays a confirmation with the new patient ID. |
| **Alternative Course of Action** | 3a. If required fields are missing or invalid, the system highlights the errors and prevents submission.<br>4a. If a possible duplicate is found, the system flags it for receptionist review before creating a new record. |
| **Postcondition** | A new patient record exists in the system. |

**Table 11: Use Case UC-05 – Update Patient Demographic Information**

| Field | Detail |
|---|---|
| **Actor(s)** | Receptionist, Healthcare Professional |
| **Description** | Allows authorized staff to update an existing patient's demographic or contact details. |
| **Precondition** | The patient record exists; the user is logged in. |
| **Basic Course of Action** | 1. User searches for and opens the patient record.<br>2. User selects "Edit Information".<br>3. User updates the relevant fields.<br>4. User saves the changes.<br>5. System validates and updates the record. |
| **Alternative Course of Action** | 3a. If updated fields are invalid, the system highlights the errors and prevents saving. |
| **Postcondition** | The patient's information is updated in the database. |

**Table 12: Use Case UC-06 – Search / Retrieve Patient Record**

| Field | Detail |
|---|---|
| **Actor(s)** | Receptionist, Healthcare Professional, Administrator |
| **Description** | Allows an authorized user to locate and view a patient's record. |
| **Precondition** | User is logged in. |
| **Basic Course of Action** | 1. User enters a search term (name, patient ID, or phone number).<br>2. System queries the database and returns matching results.<br>3. User selects the correct patient from the results list.<br>4. System displays the patient's full record. |
| **Alternative Course of Action** | 2a. If no matches are found, the system displays a "no results found" message. |
| **Postcondition** | The requested patient record is displayed to the user. |

**Table 13: Use Case UC-07 – Add Medical Record Entry**

| Field | Detail |
|---|---|
| **Actor(s)** | Healthcare Professional |
| **Description** | Allows a healthcare professional to add a diagnosis and notes entry to a patient's medical history following a consultation. |
| **Precondition** | The patient record exists; the Healthcare Professional is logged in. |
| **Basic Course of Action** | 1. Healthcare Professional opens the patient's record.<br>2. Healthcare Professional selects "Add Medical Entry".<br>3. Healthcare Professional enters the visit date, diagnosis, and clinical notes.<br>4. Healthcare Professional submits the entry.<br>5. System saves the entry, timestamps it, and links it to the professional's identity. |
| **Alternative Course of Action** | N/A |
| **Postcondition** | A new, permanent medical record entry is attached to the patient's history. |

**Table 14: Use Case UC-08 – View Medical History**

| Field | Detail |
|---|---|
| **Actor(s)** | Healthcare Professional |
| **Description** | Allows a healthcare professional to review a patient's full medical history in chronological order. |
| **Precondition** | The patient record exists. |
| **Basic Course of Action** | 1. Healthcare Professional opens the patient's record.<br>2. Healthcare Professional selects "Medical History".<br>3. System retrieves and displays all past entries, most recent first. |
| **Alternative Course of Action** | N/A |
| **Postcondition** | The patient's medical history is displayed. |

**Table 15: Use Case UC-09 – Schedule Appointment**

| Field | Detail |
|---|---|
| **Actor(s)** | Receptionist |
| **Description** | Allows the receptionist to book an appointment for a patient with a healthcare professional. |
| **Precondition** | The patient record exists; the Receptionist is logged in. |
| **Basic Course of Action** | 1. Receptionist searches for and selects the patient.<br>2. Receptionist selects a healthcare professional and preferred date.<br>3. System displays available time slots.<br>4. Receptionist selects a slot and enters the reason for the visit.<br>5. System verifies the slot is still available.<br>6. System creates the appointment with status "Scheduled". |
| **Alternative Course of Action** | 5a. If the slot was taken in the meantime, the system notifies the receptionist and refreshes the available slots. |
| **Postcondition** | The appointment is created and appears on the appointment calendar. |

**Table 16: Use Case UC-10 – Reschedule / Cancel Appointment**

| Field | Detail |
|---|---|
| **Actor(s)** | Receptionist |
| **Description** | Allows the receptionist to modify or cancel an existing appointment. |
| **Precondition** | An appointment exists. |
| **Basic Course of Action** | 1. Receptionist locates the appointment via search or calendar view.<br>2. Receptionist selects "Reschedule" or "Cancel".<br>3. For reschedule, the receptionist selects a new available slot; the system updates the appointment.<br>4. For cancel, the receptionist confirms cancellation; the system updates the status to "Cancelled". |
| **Alternative Course of Action** | N/A |
| **Postcondition** | The appointment's date, time, or status is updated accordingly. |

**Table 17: Use Case UC-11 – View Appointment Calendar**

| Field | Detail |
|---|---|
| **Actor(s)** | Receptionist, Healthcare Professional |
| **Description** | Allows staff to view scheduled appointments in a calendar or list view. |
| **Precondition** | User is logged in. |
| **Basic Course of Action** | 1. User navigates to the Appointments module.<br>2. User selects a date range or view (day, week, or month).<br>3. System displays all matching appointments with patient and status details. |
| **Alternative Course of Action** | N/A |
| **Postcondition** | The requested appointment schedule is displayed. |

**Table 18: Use Case UC-12 – Generate Administrative Report**

| Field | Detail |
|---|---|
| **Actor(s)** | Administrator |
| **Description** | Allows the administrator to generate summary reports on clinic activity. |
| **Precondition** | Administrator is logged in. |
| **Basic Course of Action** | 1. Administrator navigates to the Reports module.<br>2. Administrator selects a report type and date range.<br>3. Administrator requests report generation.<br>4. System aggregates the relevant data and builds the report.<br>5. System displays the report; the administrator may view, print, or export it. |
| **Alternative Course of Action** | 4a. If no data is found for the selected range, the system displays a "no records found" message. |
| **Postcondition** | The report is generated and made available to the administrator. |


#### 3.4.4. Dynamic Model (Activity Diagrams)

Activity diagrams for four representative use cases — one from each major workflow — are presented below to illustrate the step-by-step logic and decision points of the system.

![](diagrams/act1_login.png)

*Figure 4: Activity Diagram for 'Login' Use Case*

![](diagrams/act2_register_patient.png)

*Figure 5: Activity Diagram for 'Register New Patient' Use Case*

![](diagrams/act3_schedule_appointment.png)

*Figure 6: Activity Diagram for 'Schedule Appointment' Use Case*

![](diagrams/act4_generate_report.png)

*Figure 7: Activity Diagram for 'Generate Administrative Report' Use Case*

#### 3.4.5. Object Model (Class Diagram)

The class diagram below shows the core domain entities of the system and their relationships. A single `User` class, distinguished by a `Role` attribute, represents all staff accounts (Receptionist, Healthcare Professional, and Administrator), reflecting the fact that these roles share the same authentication and account-management behavior while differing only in permissions. `Patient`, `MedicalRecord`, and `Appointment` form the clinical core of the system, while `AuditLog` supports the accountability requirement defined in NFR-10.

![](diagrams/class_diagram.png)

*Figure 8: Class Diagram for the Patient Record and Appointment Management System*

## 4. User Interface

The user interface will be implemented as a responsive web application (Next.js, TypeScript, Tailwind CSS) accessible from desktop and tablet browsers used at clinic reception and consultation desks. This section presents the navigational flow between screens, low-fidelity mock-ups of the key screens identified so far, and an inventory of all planned screens. These are preliminary; higher-fidelity mock-ups and, subsequently, implemented-screen screenshots will replace them as the interface is built during the Design and Implementation phases.

**Navigational Flow**

Figure 9 shows the sequence of screens a user moves through, starting from login and branching by role. Solid arrows represent direct navigation; labels indicate the action that triggers the transition.

![](diagrams/nav_flow.png)

*Figure 9: Navigational Flow Diagram*

**Low-Fidelity Mock-ups**

![](diagrams/wf1_login.png)

*Figure 10: Login Screen – Low-Fidelity Mock-up*

![](diagrams/wf2_register.png)

*Figure 11: Patient Registration Screen – Low-Fidelity Mock-up*

![](diagrams/wf3_search.png)

*Figure 12: Patient Search & Record View – Low-Fidelity Mock-up*

![](diagrams/wf4_booking.png)

*Figure 13: Appointment Booking Screen – Low-Fidelity Mock-up*

**Planned Screen Inventory**

**Table 19: Planned User Interface Screens**

| Screen | Primary User(s) | Key Elements |
|---|---|---|
| Login Page | All staff | Email field, password field, login button, error message area |
| Role-Specific Dashboard | All staff | Navigation menu, quick stats/summary cards, recent activity |
| Patient Registration Form | Receptionist | Demographic fields, contact fields, duplicate-check warning, submit button |
| Patient Search & Record View | Receptionist, Healthcare Professional, Administrator | Search bar, results list, patient summary panel, medical history timeline |
| Medical Record Entry Form | Healthcare Professional | Visit date, diagnosis field, clinical notes field, save button |
| Appointment Calendar | Receptionist, Healthcare Professional | Day/week/month view, appointment cards, status color-coding |
| Appointment Booking Form | Receptionist | Patient selector, staff selector, available slot grid, reason field |
| User Management Panel | Administrator | Staff account list, add/edit staff form, role assignment, status toggle |
| Reports Module | Administrator | Report type selector, date range filter, generated report view, export/print controls |

Across all screens, the interface will follow a consistent layout: a persistent role-aware navigation bar, a primary content area, and clear success/error feedback for form submissions, in line with the usability requirement defined in Section 3.3 (NFR-05).

## 5. References

[1] I. Sommerville, *Software Engineering*, 10th ed. Boston, MA: Pearson, 2020.

[2] R. S. Pressman and B. R. Maxim, *Software Engineering: A Practitioner's Approach*, 9th ed. New York: McGraw-Hill, 2020.

[3] K. C. Laudon and J. P. Laudon, *Management Information Systems: Managing the Digital Firm*, 17th ed. Boston, MA: Pearson, 2022.

[4] M. B. Buntin, M. F. Burke, M. C. Hoaglin, and D. Blumenthal, "The benefits of health information technology: A review of the recent literature," *Health Affairs*, vol. 30, no. 3, pp. 464–471, Mar. 2011.

[5] Federal Negarit Gazette, "Personal Data Protection Proclamation No. 1321/2024," Federal Democratic Republic of Ethiopia, Addis Ababa, Ethiopia, Jul. 24, 2024.

[6] HiLCoE School of Computer Science and Technology, *Senior Project Documentation Guideline*, Version 1.4.3, 2024.

[7] PRAAMS Project Team, "Patient Record and Appointment Management System for Addis Ababa Private Clinics," Senior Project Proposal Document, HiLCoE School of Computer Science and Technology, Addis Ababa, Ethiopia, Aug. 2026.

## 6. Annexes

### 6.1. Data Collection Methods/Tools

Requirements for this system were elicited through semi-structured interviews with clinic staff and a short structured questionnaire distributed more broadly across participating clinics, supplementing the direct observation of current (manual) record-keeping and scheduling practices described in Section 2.

#### 6.1.1. Interview Questions

*Interview guide — Receptionists*

1. Walk me through what happens, step by step, when a new patient arrives at the clinic.
2. How do you currently look up an existing patient's file? How long does that usually take?
3. How are appointments currently booked, changed, or cancelled?
4. Have you ever double-booked a time slot, or had two patients scheduled at once? What happened?
5. What information do you wish you could see about a patient before they arrive?
6. What is the most frustrating or time-consuming part of your daily record-keeping and scheduling work?
7. If you could change one thing about how patient records or appointments are handled today, what would it be?

*Interview guide — Healthcare Professionals (Doctors/Nurses)*

1. When you see a patient, how do you currently access their past medical history?
2. Have you ever had to repeat a test or ask a patient to recall information because a previous record could not be found?
3. What information do you record after a consultation, and how is it currently stored?
4. How do you currently know your schedule for the day or week?
5. What concerns, if any, would you have about patient data being stored digitally rather than on paper?

*Interview guide — Clinic Administrators*

1. What kinds of reports or statistics do you currently need to produce, and how do you currently produce them?
2. How do you currently manage staff accounts, roles, or permissions, if at all?
3. What are your main concerns about the security and privacy of patient data?
4. How many staff members and approximately how many patients does the clinic manage per month?
5. What would make you confident enough to adopt a new digital system for these tasks?

#### 6.1.2. Questionnaire Questions

*Distributed to receptionists, healthcare professionals, and administrators across participating clinics. Questions 1–6 used a 5-point scale (1 = Strongly Disagree, 5 = Strongly Agree) unless noted otherwise.*

1. Locating a specific patient's file is quick and easy under our current process.
2. Our current appointment scheduling process rarely results in conflicts or errors.
3. I am confident that patient records are kept secure and only accessed by authorized staff.
4. I would be comfortable using a computer-based system to register patients and manage records, given basic training.
5. Generating administrative reports under our current process is fast and straightforward.
6. A digital system would improve the quality of service we provide to patients.
7. On average, how many patients does your clinic register per week? *(open response)*
8. What device(s) would you primarily use to access a clinic system? *(Desktop computer / Laptop / Tablet / Smartphone / Other)*
9. What is your role at the clinic? *(Receptionist / Healthcare Professional / Administrator / Other)*
10. Is there anything else you would like a new patient record and appointment system to include? *(open response)*

---

*End of Requirements Analysis and Specification Document.*
