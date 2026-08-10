export type UserRole = "staff" | "admin";

export type RequestStatus =
  | "new"
  | "contacted"
  | "accepted"
  | "declined"
  | "completed";

export type Service = {
  id: string;
  title: string;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceRequest = {
  id: string;
  service_id: string;
  guest_name: string;
  guest_contact: string;
  preferred_time: string | null;
  notes: string | null;
  budget: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  services?: Pick<Service, "title"> | null;
};

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      services: {
        Row: Service;
        Insert: Partial<Pick<Service, "id" | "created_at" | "updated_at">> &
          Pick<Service, "title" | "description"> &
          Partial<Pick<Service, "active">>;
        Update: Partial<Omit<Service, "id" | "created_at" | "updated_at">>;
      };
      service_requests: {
        Row: ServiceRequest;
        Insert: Partial<
          Pick<ServiceRequest, "id" | "status" | "created_at" | "updated_at">
        > &
          Pick<ServiceRequest, "service_id" | "guest_name" | "guest_contact"> &
          Partial<Pick<ServiceRequest, "preferred_time" | "notes" | "budget">>;
        Update: Partial<
          Pick<
            ServiceRequest,
            "status" | "preferred_time" | "notes" | "budget" | "updated_at"
          >
        >;
      };
      profiles: {
        Row: Profile;
        Insert: Pick<Profile, "id" | "email" | "role"> &
          Partial<Pick<Profile, "display_name" | "created_at" | "updated_at">>;
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
      };
      staff_service_assignments: {
        Row: {
          staff_id: string;
          service_id: string;
          created_at: string;
        };
        Insert: {
          staff_id: string;
          service_id: string;
          created_at?: string;
        };
        Update: never;
      };
    };
  };
};
