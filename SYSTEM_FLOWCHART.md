# System Flowchart - English Learning & Exam Platform

## System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        TW[Teacher Web<br/>Port 3001]
        SW[Student Web<br/>Port 3002]
    end
    
    subgraph "Backend Layer"
        API[Express API Server<br/>Port 5000]
        AUTH[Auth Middleware]
        ROUTES[API Routes]
        CTRL[Controllers]
    end
    
    subgraph "Database Layer"
        DB[(Supabase PostgreSQL)]
        FS[File Storage<br/>uploads/avatars]
    end
    
    TW -->|HTTP/REST| API
    SW -->|HTTP/REST| API
    API --> AUTH
    AUTH --> ROUTES
    ROUTES --> CTRL
    CTRL --> DB
    CTRL --> FS
    
    style TW fill:#4A90E2,color:#fff
    style SW fill:#50C878,color:#fff
    style API fill:#FF6B6B,color:#fff
    style DB fill:#9B59B6,color:#fff
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Backend API
    participant DB as Database
    
    U->>FE: Enter credentials
    FE->>API: POST /api/auth/login
    API->>DB: Verify user credentials
    DB-->>API: User data
    API->>API: Generate JWT token
    API-->>FE: Token + User info
    FE->>FE: Store token in localStorage
    FE->>FE: Set user context
    FE-->>U: Redirect to Dashboard
```

## Teacher Workflow

```mermaid
flowchart TD
    Start([Teacher Login]) --> Auth{Authenticated?}
    Auth -->|No| Login[Login Page]
    Auth -->|Yes| Dashboard[Dashboard]
    
    Dashboard --> Menu{Select Action}
    
    Menu -->|Classes| ClassMgmt[Class Management]
    Menu -->|Exams| ExamMgmt[Exam Management]
    Menu -->|Assignments| AssignMgmt[Assignment Management]
    Menu -->|Profile| Profile[Profile Settings]
    
    ClassMgmt --> CreateClass[Create Class]
    CreateClass --> GenCode[Generate Class Code]
    GenCode --> ShareCode[Share Code with Students]
    
    ExamMgmt --> CreateExam[Create Exam]
    CreateExam --> AddQuestions[Add Questions]
    AddQuestions --> ConfigExam[Configure Settings]
    ConfigExam --> Activate[Activate Exam]
    Activate --> ViewResults[View Results]
    
    AssignMgmt --> CreateAssign[Create Assignment]
    CreateAssign --> GradeSubmissions[Grade Submissions]
    
    Profile --> UpdateInfo[Update Profile]
    UpdateInfo --> UploadAvatar[Upload Avatar]
    
    style Start fill:#4A90E2,color:#fff
    style Dashboard fill:#50C878,color:#fff
    style CreateExam fill:#FF6B6B,color:#fff
    style ViewResults fill:#9B59B6,color:#fff
```

## Student Workflow

```mermaid
flowchart TD
    Start([Student Login]) --> Auth{Authenticated?}
    Auth -->|No| Login[Login Page]
    Auth -->|Yes| Dashboard[Dashboard]
    
    Dashboard --> Menu{Select Action}
    
    Menu -->|Join Class| JoinClass[Join Class]
    Menu -->|Exams| ExamList[View Exams]
    Menu -->|Assignments| AssignList[View Assignments]
    Menu -->|Grades| Grades[View Grades]
    Menu -->|Profile| Profile[Profile Settings]
    
    JoinClass --> EnterCode[Enter Class Code]
    EnterCode --> ValidateCode{Valid Code?}
    ValidateCode -->|No| Error[Show Error]
    ValidateCode -->|Yes| JoinSuccess[Joined Class]
    
    ExamList --> SelectExam[Select Exam]
    SelectExam --> StartExam[Start Exam]
    StartExam --> AntiCheat[Enable Anti-Cheat]
    AntiCheat --> AnswerQuestions[Answer Questions]
    AnswerQuestions --> AutoSave[Auto Save Answers]
    AutoSave --> TimeCheck{Time Left?}
    TimeCheck -->|Yes| AnswerQuestions
    TimeCheck -->|No| AutoSubmit[Auto Submit]
    AutoSubmit --> ViewResult[View Result]
    
    AssignList --> SelectAssign[Select Assignment]
    SelectAssign --> DoAssign[Do Assignment]
    DoAssign --> SubmitAssign[Submit Assignment]
    SubmitAssign --> WaitGrade[Wait for Grade]
    
    Grades --> ViewScores[View All Scores]
    
    Profile --> UpdateInfo[Update Profile]
    UpdateInfo --> UploadAvatar[Upload Avatar]
    
    style Start fill:#4A90E2,color:#fff
    style Dashboard fill:#50C878,color:#fff
    style StartExam fill:#FF6B6B,color:#fff
    style ViewResult fill:#9B59B6,color:#fff
```

## Exam Flow (Detailed)

```mermaid
sequenceDiagram
    participant T as Teacher
    participant API as Backend
    participant DB as Database
    participant S as Student
    participant Exam as Exam Engine
    
    T->>API: Create Exam
    API->>DB: Save Exam
    DB-->>API: Exam Created
    API-->>T: Exam Code
    
    T->>API: Activate Exam
    API->>DB: Update Status
    DB-->>API: Updated
    
    S->>API: Get Available Exams
    API->>DB: Query Exams
    DB-->>API: Exam List
    API-->>S: Show Exams
    
    S->>API: Start Exam
    API->>DB: Create Attempt
    DB-->>API: Attempt ID
    API->>Exam: Initialize Exam
    Exam-->>S: Load Questions
    
    loop Answer Questions
        S->>Exam: Submit Answer
        Exam->>API: Save Answer
        API->>DB: Update Attempt
    end
    
    Exam->>Exam: Time Check
    Exam->>API: Auto Submit
    API->>DB: Calculate Score
    DB-->>API: Final Score
    API->>Exam: Show Results
    Exam-->>S: Display Results
    
    T->>API: View Results
    API->>DB: Get Attempts
    DB-->>API: All Attempts
    API-->>T: Results Dashboard
```

## Class Management Flow

```mermaid
flowchart LR
    T[Teacher] -->|1. Create Class| Create[Create Class API]
    Create -->|2. Generate Code| Code[Class Code: ABC123]
    Code -->|3. Share| Share[Share with Students]
    
    S[Student] -->|4. Enter Code| Join[Join Class API]
    Join -->|5. Validate| Validate{Valid?}
    Validate -->|Yes| Add[Add to Class]
    Validate -->|No| Error[Show Error]
    Add -->|6. Link| Link[Link Student to Class]
    
    Link -->|7. Access| Access[Access Class Exams]
    
    style T fill:#4A90E2,color:#fff
    style S fill:#50C878,color:#fff
    style Code fill:#FF6B6B,color:#fff
    style Add fill:#9B59B6,color:#fff
```

## Data Flow - Exam Submission

```mermaid
flowchart TD
    Start([Student Starts Exam]) --> Init[Initialize Exam Attempt]
    Init --> LoadQ[Load Questions]
    LoadQ --> Display[Display Questions]
    
    Display --> Answer[Student Answers]
    Answer --> AutoSave[Auto Save to Backend]
    AutoSave --> DB[(Save to Database)]
    
    Answer --> Monitor[Monitor Violations]
    Monitor --> CheckViol{5+ Violations?}
    CheckViol -->|Yes| ForceSubmit[Force Submit]
    CheckViol -->|No| Continue[Continue]
    
    Continue --> TimeCheck{Time Up?}
    TimeCheck -->|No| Answer
    TimeCheck -->|Yes| AutoSubmit[Auto Submit]
    
    ForceSubmit --> Submit[Submit Exam]
    AutoSubmit --> Submit
    
    Submit --> Grade[Auto Grade]
    Grade --> CalcScore[Calculate Score]
    CalcScore --> SaveResult[Save Result]
    SaveResult --> ShowResult[Show Result to Student]
    
    ShowResult --> TeacherView[Teacher Views Results]
    
    style Start fill:#4A90E2,color:#fff
    style Submit fill:#FF6B6B,color:#fff
    style Grade fill:#50C878,color:#fff
    style ShowResult fill:#9B59B6,color:#fff
```

## Anti-Cheat System Flow

```mermaid
flowchart TD
    Start([Exam Started]) --> Enable[Enable Anti-Cheat]
    
    Enable --> Fullscreen[Force Fullscreen]
    Enable --> BlockCopy[Block Copy/Paste]
    Enable --> BlockRight[Block Right Click]
    Enable --> BlockKeys[Block DevTools Keys]
    Enable --> MonitorTab[Monitor Tab Changes]
    Enable --> Webcam[Request Webcam]
    
    Fullscreen --> Detect[Detect Violations]
    BlockCopy --> Detect
    BlockRight --> Detect
    BlockKeys --> Detect
    MonitorTab --> Detect
    Webcam --> Detect
    
    Detect --> Log[Log Violation]
    Log --> Count[Count Violations]
    Count --> Check{Count >= 5?}
    
    Check -->|Yes| ForceSubmit[Force Submit Exam]
    Check -->|No| Continue[Continue Monitoring]
    Continue --> Detect
    
    ForceSubmit --> End([Exam Submitted])
    
    style Start fill:#4A90E2,color:#fff
    style Detect fill:#FF6B6B,color:#fff
    style ForceSubmit fill:#9B59B6,color:#fff
    style End fill:#50C878,color:#fff
```

## API Request Flow

```mermaid
flowchart TD
    Client[Frontend Client] --> Request[HTTP Request]
    Request --> CORS[CORS Middleware]
    CORS --> Auth{Has Token?}
    
    Auth -->|No| PublicRoute{Public Route?}
    PublicRoute -->|Yes| Process[Process Request]
    PublicRoute -->|No| Unauthorized[401 Unauthorized]
    
    Auth -->|Yes| Verify[Verify JWT Token]
    Verify --> Valid{Valid?}
    Valid -->|No| Unauthorized
    Valid -->|Yes| Authorize{Role Check}
    
    Authorize -->|Pass| Process
    Authorize -->|Fail| Forbidden[403 Forbidden]
    
    Process --> Controller[Controller]
    Controller --> Service[Service/Business Logic]
    Service --> DB[(Database)]
    DB --> Service
    Service --> Controller
    Controller --> Response[HTTP Response]
    Response --> Client
    
    style Client fill:#4A90E2,color:#fff
    style Process fill:#50C878,color:#fff
    style DB fill:#9B59B6,color:#fff
    style Unauthorized fill:#FF6B6B,color:#fff
```

## File Upload Flow (Avatar)

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Backend API
    participant Multer as Multer Middleware
    participant FS as File System
    participant DB as Database
    
    U->>FE: Select Image File
    FE->>FE: Validate File (type, size)
    FE->>FE: Show Preview
    U->>FE: Click Upload
    FE->>API: POST /api/auth/avatar (FormData)
    API->>Multer: Process Upload
    Multer->>FS: Save to uploads/avatars/
    FS-->>Multer: File Saved
    Multer-->>API: File Info
    
    API->>DB: Get Current User
    DB-->>API: User Data
    
    alt Old Avatar Exists
        API->>FS: Delete Old Avatar
    end
    
    API->>DB: Update avatar_url
    DB-->>API: Updated User
    API-->>FE: New Avatar URL + User
    FE->>FE: Update User Context
    FE->>FE: Update Avatar Display
    FE-->>U: Show Success
```

## Complete System Overview

```mermaid
graph TB
    subgraph "User Roles"
        Teacher[👨‍🏫 Teacher]
        Student[👨‍🎓 Student]
    end
    
    subgraph "Frontend Applications"
        TW[Teacher Web<br/>React + Vite<br/>Port 3001]
        SW[Student Web<br/>React + Vite<br/>Port 3002]
    end
    
    subgraph "Backend Services"
        API[Express API Server<br/>TypeScript<br/>Port 5000]
        AUTH[Authentication<br/>JWT]
        UPLOAD[File Upload<br/>Multer]
    end
    
    subgraph "Database & Storage"
        DB[(Supabase<br/>PostgreSQL)]
        AVATARS[Avatar Storage<br/>uploads/avatars]
    end
    
    subgraph "Core Features"
        CLASSES[Class Management]
        EXAMS[Exam Engine]
        ASSIGN[Assignments]
        GRADES[Grading System]
        PROFILE[User Profile]
    end
    
    Teacher --> TW
    Student --> SW
    
    TW --> API
    SW --> API
    
    API --> AUTH
    API --> UPLOAD
    API --> CLASSES
    API --> EXAMS
    API --> ASSIGN
    API --> GRADES
    API --> PROFILE
    
    CLASSES --> DB
    EXAMS --> DB
    ASSIGN --> DB
    GRADES --> DB
    PROFILE --> DB
    PROFILE --> AVATARS
    
    UPLOAD --> AVATARS
    
    style Teacher fill:#4A90E2,color:#fff
    style Student fill:#50C878,color:#fff
    style API fill:#FF6B6B,color:#fff
    style DB fill:#9B59B6,color:#fff
    style EXAMS fill:#F39C12,color:#fff
```

## Key Features Flow

```mermaid
mindmap
  root((English Learning<br/>& Exam Platform))
    Authentication
      Login/Logout
      JWT Token
      Role-based Access
    Class Management
      Create Class
      Generate Code
      Join Class
      View Students
    Exam System
      Create Exam
      Question Types
      Anti-Cheat
      Auto Grading
      Results View
    Assignment System
      Create Assignment
      Submit Work
      Grade Assignment
      View Grades
    User Profile
      Update Info
      Change Password
      Upload Avatar
    Dashboard
      Statistics
      Recent Activity
      Quick Actions
```

---

## Legend

- **Blue**: Teacher actions/features
- **Green**: Student actions/features  
- **Red**: Backend/API processes
- **Purple**: Database operations
- **Orange**: Critical processes (Exams)

## Notes

1. **Authentication**: All API requests (except login/register) require JWT token
2. **Role-based Access**: Teacher and Student have different permissions
3. **Real-time**: Exam violations are logged in real-time
4. **Auto-save**: Student answers are automatically saved during exam
5. **Auto-submit**: Exam automatically submits when time expires or violations exceed limit
6. **File Storage**: Avatars stored locally in `server/uploads/avatars/`

