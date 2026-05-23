import type { Page, Route } from "@playwright/test";

const product = {
  id: 1,
  name: "Sliding Door",
  description: "The best sliding door in town.",
  unit: "sqm",
  price_per_unit: 7000,
  is_active: true,
  cover_image: "/images/landing/windows.jpg",
  categories: [{ id: 1, name: "Doors" }],
  images: [{ id: 1, image_url: "/images/landing/windows.jpg" }],
  variants: [{ id: 1, width: 120, height: 240, price: 7000, is_active: true, images: [] }],
  option_groups: [
    {
      id: 1,
      name: "Glass Type",
      is_required: true,
      sort_order: 1,
      options: [{ id: 1, name: "Tempered Glass", price_modifier: 1000, sort_order: 1, is_active: true }],
    },
  ],
};

const quotationItem = {
  id: 1,
  product_id: 1,
  product,
  name: "Sliding Door",
  description: "The best sliding door in town.",
  width: 120,
  height: 240,
  thickness: 6,
  pieces: 1,
  amount_per_piece: 6000,
  options_amount: 1000,
  total_amount: 7000,
  status: "approved",
  status_label: "Approved",
  notes: null,
  options: [{ id: 1, group_name: "Glass Type", option_name: "Tempered Glass", price_modifier: 1000 }],
  before_images: [],
  after_images: [],
};

const quotation = {
  id: 1,
  quotation_number: "QTE-000001-20260523",
  notes: "Approved for testing.",
  discount: 0,
  subtotal: 7000,
  total: 7000,
  grand_total: 7000,
  signature_status: "pending",
  customer_signed_at: null,
  items: [quotationItem],
  created_at: "2026-05-23T02:00:00.000000Z",
};

const appointment = {
  id: 1,
  appointment_number: "APT-000001-20260523",
  first_name: "Nathaniel",
  last_name: "Alvarez",
  full_name: "Nathaniel Alvarez",
  phone_number: "+639266887267",
  email: "nathaniel@example.com",
  address: "General Trias, Cavite, Philippines",
  address_pinned: "General Trias, Cavite, Philippines",
  address_lat: "14.2800",
  address_lng: "120.9000",
  preferred_date: "2026-05-25",
  preferred_time: "afternoon",
  service_type: "quotation",
  service_type_other: null,
  additional_notes: "E2E appointment notes",
  appointment_date: "2026-05-26",
  appointment_time_from: "09:00",
  appointment_time_until: "11:00",
  status: "confirmed",
  status_label: "Confirmed",
  can_edit: false,
  can_cancel: false,
  created_at: "2026-05-23T02:00:00.000000Z",
  workers: [{ id: 1, full_name: "Admin User" }],
  quotation,
  work_job: {
    id: 1,
    work_job_number: "WJ-000001-20260523",
    status: "in_progress",
    status_label: "In Progress",
    scheduled_date: "2026-05-26",
    scheduled_time_from: "09:00",
    scheduled_time_until: "11:00",
  },
  remarks: [
    {
      id: 1,
      action: "confirmed",
      message: "Appointment confirmed.",
      by: "Admin User",
      created_at: "2026-05-23T03:00:00.000000Z",
    },
  ],
};

const paymentSummary = {
  quotation_total: 7000,
  base_quotation_total: 7000,
  source_quotation_total: 0,
  approved_charges_total: 0,
  pending_charges_total: 0,
  discount_total: 0,
  payable_total: 7000,
  paid_amount: 0,
  remaining_amount: 7000,
  down_payment_required: false,
  down_payment_percentage: 20,
  down_payment_amount: 1400,
  down_payment_paid_amount: 0,
  down_payment_remaining_amount: 1400,
  is_down_payment_paid: false,
  is_fully_paid: false,
  can_accept_payment: true,
  payment_not_required: false,
};

const workJob = {
  id: 1,
  work_job_number: "WJ-000001-20260523",
  appointment_id: 1,
  quotation_id: 1,
  parent_work_job_id: null,
  is_back_job: false,
  back_job_reason: null,
  first_name: "Nathaniel",
  last_name: "Alvarez",
  full_name: "Nathaniel Alvarez",
  phone_number: "+639266887267",
  email: "nathaniel@example.com",
  address: "General Trias, Cavite, Philippines",
  address_pinned: "General Trias, Cavite, Philippines",
  address_lat: "14.2800",
  address_lng: "120.9000",
  service_type: "installation",
  service_type_other: null,
  scheduled_date: "2026-05-26",
  scheduled_time_from: "09:00",
  scheduled_time_until: "11:00",
  status: "in_progress",
  status_label: "In Progress",
  notes: "E2E work job notes",
  created_at: "2026-05-23T04:00:00.000000Z",
  workers: [{ id: 1, full_name: "Admin User" }],
  appointment,
  quotation,
  remarks: [
    {
      id: 1,
      action: "in_progress",
      message: "Installation started.",
      by: "Admin User",
      created_at: "2026-05-23T05:00:00.000000Z",
    },
  ],
  payments: [],
  charges: [],
  back_jobs: [],
  payment_summary: paymentSummary,
};

const user = {
  id: 1,
  username: "customer",
  first_name: "Nathaniel",
  last_name: "Alvarez",
  full_name: "Nathaniel Alvarez",
  email: "nathaniel@example.com",
  phone: "+639266887267",
  roles: ["customer"],
  permissions: [],
};

const trackingResult = {
  type: "appointment",
  reference_number: "APT-000001-20260523",
  status: "confirmed",
  full_name: "Nathaniel Alvarez",
  phone_number: "+639266887267",
  email: "nathaniel@example.com",
  address: "General Trias, Cavite, Philippines",
  service_type: "quotation",
  preferred_date: "2026-05-25",
  preferred_time: "afternoon",
  appointment_date: "2026-05-26",
  appointment_time_from: "09:00",
  appointment_time_until: "11:00",
  scheduled_date: null,
  scheduled_time_from: null,
  scheduled_time_until: null,
  workers: ["Admin User"],
  has_quotation: true,
  items: [
    {
      name: "Sliding Door",
      size: "120 x 240 cm",
      pieces: 1,
      options: ["Tempered Glass"],
      total_amount: 7000,
      status: "approved",
    },
  ],
  quotation_notes: "Approved for testing.",
  discount: 0,
  grand_total: 7000,
  remarks: [
    {
      action: "confirmed",
      message: "Appointment confirmed.",
      by: "SOG Team",
      created_at: "2026-05-23T03:00:00.000000Z",
    },
  ],
  additional_notes: "E2E appointment notes",
  notes: null,
};

export async function mockApi(page: Page) {
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const fortifyPostPaths = new Set(["/login", "/logout", "/two-factor-challenge"]);
    const isBackendRequest =
      url.port === "8000" ||
      path === "/api/user" ||
      path.startsWith("/api/") ||
      (method !== "GET" && fortifyPostPaths.has(path));

    if (!isBackendRequest) {
      await route.fallback();
      return;
    }

    if (process.env.E2E_DEBUG_REQUESTS) {
      console.log(`[mock-api] ${method} ${path}`);
    }

    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders(request.headers().origin) });
      return;
    }

    if (path === "/api/user") return json(route, user);
    if ((path === "/api/login" || path === "/login") && method === "POST") {
      return json(route, { two_factor: true, challenge_id: "e2e-challenge" });
    }
    if ((path === "/api/two-factor-challenge" || path === "/two-factor-challenge") && method === "POST") {
      return json(route, { user });
    }
    if (path === "/api/customer/request-otp" && method === "POST") {
      return json(route, { message: "Verification code sent." });
    }
    if (path === "/api/customer/verify-otp" && method === "POST") {
      return json(route, { data: user });
    }
    if (path === "/api/v1/products") return json(route, [product]);
    if (path === "/api/v1/track") return json(route, { data: trackingResult });
    if (path === "/api/v1/notifications") return json(route, { data: [], unread_count: 0 });
    if (path === "/api/v1/customer/appointments") return json(route, paginated([appointment]));
    if (path === "/api/v1/customer/appointments/1") return json(route, { data: appointment });
    if (path === "/api/v1/customer/work-jobs") return json(route, paginated([workJob]));
    if (path === "/api/v1/customer/work-jobs/1") return json(route, { data: workJob });
    if (path === "/api/v1/customer/payments/paypal/config") {
      return json(route, { enabled: false, client_id: null, currency: "PHP", mode: "sandbox" });
    }

    return json(route, {});
  });
}

export async function signInAsCustomer(page: Page) {
  await page.context().addCookies([
    { name: "auth_token", value: "e2e-token", domain: "127.0.0.1", path: "/" },
    { name: "user_role", value: "customer", domain: "127.0.0.1", path: "/" },
  ]);
}

function paginated<T>(data: T[]) {
  return {
    data,
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: data.length,
      from: data.length ? 1 : null,
      to: data.length,
    },
    links: {},
  };
}

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers: corsHeaders(route.request().headers().origin),
    body: JSON.stringify(body),
  });
}

function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin ?? "http://127.0.0.1:3000",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, X-Requested-With",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  };
}
