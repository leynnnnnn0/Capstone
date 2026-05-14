export type CustomerOtpContactType = "email" | "phone";

export type RequestCustomerOtpResponse = {
  message: string;
  data: {
    contact: string;
    contact_type: CustomerOtpContactType;
    expires_in: number;
  };
};

export type CustomerUser = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone_number: string | null;
  role: "customer" | "admin" | "worker";
};

export type VerifyCustomerOtpResponse = {
  user: CustomerUser;
  token?: string;
};
