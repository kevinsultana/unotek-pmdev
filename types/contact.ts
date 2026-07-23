// Contact Types - postman API /api/v1/contacts spec

export type CompanyType = "company" | "person";

export interface ContactTag {
  id: number;
  name: string;
  color?: number | string;
}

export interface Contact {
  id: number;
  name: string;
  company_type: CompanyType;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  vat?: string; // NPWP
  function?: string; // Job position (for person)
  street?: string;
  street2?: string;
  city?: string;
  zip?: string;
  state_id?: number | { id: number; name: string } | null;
  country_id?: number | { id: number; name: string } | null;
  parent_id?: number | { id: number; name: string } | null;
  parent_name?: string;
  company_name?: string;
  comment?: string;
  active?: boolean;
  category_id?: number[];
  category_ids?: number[];
  tags?: ContactTag[];
  lang?: string;
  child_ids?: Contact[];
  persons?: Contact[];
  created_at?: string;
  updated_at?: string;
}

export interface ContactListParams {
  page?: number;
  per_page?: number;
  search?: string;
  company_type?: CompanyType;
  parent_id?: number;
  country_id?: number;
  category_id?: number;
  active?: boolean;
}

export interface ContactCreateParams {
  name: string;
  company_type?: CompanyType;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  vat?: string;
  function?: string;
  street?: string;
  street2?: string;
  city?: string;
  zip?: string;
  state_id?: number;
  country_id?: number;
  parent_id?: number;
  company_name?: string;
  comment?: string;
  category_ids?: number[];
  lang?: string;
}

export interface ContactUpdateParams extends Partial<ContactCreateParams> {
  active?: boolean;
}
