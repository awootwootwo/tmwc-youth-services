# TMWC Youth Website MVP Documentation

**Date revised:** August 10, 2026

## Project Idea

A simple website for TMWC Youth to share their gifts and services with others while keeping the mission centered on service, stewardship, and sharing the Gospel.

This project started from the idea of creating a Christian-values-based "business" where the youth can use their gifts to serve people. Money is not the main goal. The goal is service, stewardship, and mission.

## Mission

We share what God has given us and use it to serve other people. Money is not the goal; it is only one resource that can help carry out the mission. The focus is serving people, stewarding gifts well, and sharing the Gospel with or without payment.

## Vision

To help TMWC Youth use their God-given gifts in practical ways that bless people, build responsibility, and support the ministry's mission.

## MVP Goal

The MVP should prove one simple thing:

Visitors can discover available services and send a request that the TMWC Youth team can receive, review, and respond to.

## MVP Features

1. Landing page with mission, vision, and a short explanation of the project.
2. Services page that shows the available services.
3. Service request form for guests and visitors.
4. Request details should include:
   - name
   - contact information
   - selected service
   - preferred date or time
   - notes or details
   - optional budget or willingness to pay
5. Admin or staff page to view incoming service requests.
6. Simple admin login.
7. Admin can add, edit, and remove services.
8. Basic request statuses:
   - New
   - Contacted
   - Accepted
   - Declined
   - Completed
9. Simple notification when a new request is submitted. This can start as email, dashboard notification, or manual checking before Messenger integration is added.

## MVP User Roles

1. **Guest or Visitor**
   - Can view the website.
   - Can browse services.
   - Can submit a service request.

2. **Staff**
   - Can view assigned or incoming requests.
   - Can respond outside the website if needed.

3. **Admin**
   - Can manage services.
   - Can manage staff accounts.
   - Can manage service requests.

## MVP Flow

1. Guest visits the website.
2. Guest reads the mission and views available services.
3. Guest chooses a service and submits a request.
4. Staff or admin sees the request.
5. Staff contacts the guest to confirm details such as price, date, time, and assigned youth staff.
6. Request status is updated until completed or declined.

## Technical Requirements

### Render Hosting Requirements

1. Host the website on Render using a production deployment.
2. Store all secrets in Render environment variables, not in the codebase.
3. Required environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`, server-side only if needed
   - any email or notification provider keys
4. Use HTTPS for all public traffic.
5. Enable automatic deploys only from the main production branch.
6. Keep preview or test deployments separate from production.
7. Do not expose admin pages unless the user is signed in and authorized.
8. Add basic health checks or deployment checks before launch.

### Supabase Requirements

1. Use Supabase for the database and authentication.
2. Suggested tables:
   - `services`
   - `service_requests`
   - `profiles`
   - `staff_service_assignments`
3. Enable Row Level Security on every table.
4. Guests may only insert service requests. They should not be able to read all requests.
5. Staff may only read and update requests they are allowed to handle.
6. Admins may manage services, staff profiles, and all requests.
7. Use Supabase Auth for admin and staff login.
8. Do not allow public self-registration for staff accounts.
9. Admins should create staff accounts manually.
10. Keep the Supabase service role key private and server-side only.
11. Never use the service role key in browser code.
12. Use database timestamps for request creation and updates.

### Secure MVP Requirements

1. Validate all request form fields before saving them.
2. Limit required guest data to only what is needed to respond.
3. Add a privacy or consent message before the guest submits contact information.
4. Protect admin and staff pages with login checks.
5. Protect admin-only actions with role checks.
6. Use least-privilege database policies.
7. Do not store passwords manually in the database.
8. Do not commit `.env` files or secret keys.
9. Rate-limit or otherwise protect the public request form from spam.
10. Sanitize text shown in the admin dashboard to prevent unsafe content.
11. Back up the database before major changes.
12. Test permissions before launch by checking guest, staff, and admin access separately.

## Needed Before Launch

1. Final project name.
2. Final list of initial services.
3. Staff members assigned to each service.
4. Required request form fields.
5. Privacy or consent note for collecting visitor contact information.
6. Render production service setup.
7. Supabase project setup.
8. Supabase tables and Row Level Security policies.
9. Basic admin account setup.
10. A clear definition of when the MVP is ready to test with real users.

## Future Features

1. Messenger / Meta API notifications.
2. Per-staff notification page.
3. Advanced role-based access control.
4. Analytics dashboard.
5. Time-series chart showing number of requests per service.
6. Bar chart showing number of accepted services per staff member.
7. Number of visits.
8. Number of clicks per visitor.
9. Visitor duration tracking.
10. Guest confirmation messages.
11. Service pricing templates.
12. Public testimonials or completed-service stories.

## Bible Passages

**Matthew 25:21**

> "His master replied, 'Well done, good and faithful servant! You have been faithful with a few things; I will put you in charge of many things.'"

**1 Timothy 6:10**

> "For the love of money is a root of all kinds of evil. Some people, eager for money, have wandered from the faith and pierced themselves with many griefs."

**1 Peter 4:10**

> "As each has received a gift, use it to serve one another, as good stewards of God's varied grace."
