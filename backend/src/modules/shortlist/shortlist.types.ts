export interface Shortlist {
  id: string;
  companyId: string;
  recruiterId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShortlistSummary {
  id: string;
  name: string;
  candidateCount: number;
  createdAt: Date;
  updatedAt: Date;
  hasCandidate?: boolean;
}

export interface ShortlistCandidateItem {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  headline: string | null;
  currentTitle: string;
  currentCompany: string;
  currentCompanyLogoUrl: string | null;
  role: string;
  seniority: string;
  yearsExperience: number;
  locationCity: string;
  locationState: string;
  locationCountry: string;
  openToWork: boolean;
  skills: string[];
  addedAt: Date;
}

export interface ShortlistPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ShortlistDetails {
  id: string;
  name: string;
  companyId: string;
  recruiterId: string;
  candidateCount: number;
  createdAt: Date;
  updatedAt: Date;
  candidates: ShortlistCandidateItem[];
  pagination: ShortlistPagination;
}

export interface CreateShortlistInput {
  name: string;
  companyId: string;
  recruiterId: string;
}

export interface AddCandidateInput {
  shortlistId: string;
  candidateId: string;
  companyId: string;
}

export interface RemoveCandidateInput {
  shortlistId: string;
  candidateId: string;
  companyId: string;
}

export interface ShortlistCandidateAssociation {
  id: string;
  shortlistId: string;
  candidateId: string;
  createdAt: Date;
}

