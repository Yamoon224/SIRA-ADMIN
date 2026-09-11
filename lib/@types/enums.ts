export enum CVStatus {
    ANALYZING = "ANALYZING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
}

export enum EventType {
    ENTRETIEN = "ENTRETIEN",
    FORMATION = "FORMATION",
    REUNION = "REUNION",
}

export enum EventStatus {
    CONFIRMED = "CONFIRMED",
    PENDING = "PENDING",
    CANCELLED = "CANCELLED",
}

export enum CandidatureStatus {
    EN_ATTENTE = "EN_ATTENTE",
    EN_COURS = "EN_COURS",
    APPROUVEE = "APPROUVEE",
    REJETEE = "REJETEE",
}

export enum CompanyStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    SUSPENDED = "SUSPENDED",
}

export enum InterviewStatus {
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    SCHEDULED = "SCHEDULED",
}

export enum JobType {
    CDI = "CDI",
    CDD = "CDD",
    STAGE = "STAGE",
    ALTERNANCE = "ALTERNANCE",
    FREELANCE = "FREELANCE",
    TEMPS_PARTIEL = "TEMPS_PARTIEL",
}

export enum JobExperienceType {
    JUNIOR = "JUNIOR",
    INTERMEDIAIRE = "INTERMEDIAIRE",
    SENIOR = "SENIOR",
    EXPERT = "EXPERT",
}

export enum JobStatus {
    ACTIVE = "ACTIVE",
    CLOSED = "CLOSED",
    DRAFT = "DRAFT",
}

export enum MatchingStatus {
    NOUVEAU = "NOUVEAU",
    EN_COURS = "EN_COURS",
    FINALISE = "FINALISE",
}

export enum ScoringStatus {
    COMPLETED = "COMPLETED",
    IN_PROGRESS = "IN_PROGRESS",
}

export enum UserRole {
    ADMIN = "ADMIN",
    USER = "USER",
    ENTERPRISE = "ENTREPRISE",
}

export enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
}

export enum PotentialPartnerStatus {
    NEW = "new",
    CONTACTED = "contacted",
    RESPONDED = "responded",
    INTERESTED = "interested",
    NOT_INTERESTED = "not_interested",
    CONVERTED = "converted",
    DO_NOT_CONTACT = "do_not_contact",
}

export enum MailCampaignStatus {
    DRAFT = "draft",
    SENDING = "sending",
    SENT = "sent",
    FAILED = "failed",
}

export enum MailCampaignRecipientStatus {
    PENDING = "pending",
    SENT = "sent",
    FAILED = "failed",
    SKIPPED = "skipped",
}