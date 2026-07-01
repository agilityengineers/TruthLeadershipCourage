import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { getPrincipal } from "@/lib/session";
import { homeForRole } from "@/lib/rbac";
import type { Role } from "@/data/types";

// Layouts
import PortalLayout from "@/app/portal/layout";
import AdminLayout from "@/app/admin/layout";
import TrainerLayout from "@/app/trainer/layout";
import CompanyLayout from "@/app/company/layout";

// Public / marketing pages
import LandingPage from "@/app/page";
import LoginPage from "@/app/login/page";
import InvitePage from "@/app/invite/page";
import AssessmentPage from "@/app/assessment/page";
import EnrollPage from "@/app/enroll/page";
import EnrollConfirmationPage from "@/app/enroll/confirmation/page";
import BookACallPage from "@/app/book-a-call/page";
import OrganizationsPage from "@/app/organizations/page";
import AppNotFound from "@/app/not-found";

// Portal pages
import PortalHome from "@/app/portal/page";
import PortalThisWeek from "@/app/portal/this-week/page";
import PortalCoaching from "@/app/portal/coaching/page";
import PortalLibrary from "@/app/portal/library/page";
import PortalMaterials from "@/app/portal/materials/page";
import PortalMessages from "@/app/portal/messages/page";
import PortalProgress from "@/app/portal/progress/page";
import PortalSettings from "@/app/portal/settings/page";
import PortalWorkbook from "@/app/portal/workbook/page";
import PortalCertificate from "@/app/portal/certificate/page";

// Admin pages
import AdminHome from "@/app/admin/page";
import AdminAnalytics from "@/app/admin/analytics/page";
import AdminAssessment from "@/app/admin/assessment/page";
import AdminBilling from "@/app/admin/billing/page";
import AdminCohorts from "@/app/admin/cohorts/page";
import AdminCommunications from "@/app/admin/communications/page";
import AdminCompanies from "@/app/admin/companies/page";
import AdminContent from "@/app/admin/content/page";
import AdminParticipants from "@/app/admin/participants/page";
import AdminResources from "@/app/admin/resources/page";
import AdminTrainers from "@/app/admin/trainers/page";
import AdminUsers from "@/app/admin/users/page";

// Trainer pages
import TrainerHome from "@/app/trainer/page";
import TrainerEvents from "@/app/trainer/events/page";
import TrainerMessages from "@/app/trainer/messages/page";
import TrainerResources from "@/app/trainer/resources/page";
import TrainerParticipants from "@/app/trainer/participants/page";
import TrainerParticipantDetail from "@/app/trainer/participants/[id]/page";

// Company pages
import CompanyHome from "@/app/company/page";
import CompanyPeople from "@/app/company/people/page";

const queryClient = new QueryClient();

type LayoutComp = (props: { children: React.ReactNode }) => React.JSX.Element;

function Protected({
  roles,
  Layout,
  children,
}: {
  roles: Role[];
  Layout: LayoutComp;
  children: React.ReactNode;
}) {
  const p = getPrincipal();
  if (!p) return <Redirect to="/login" />;
  if (!roles.includes(p.role) && p.role !== "SUPER_ADMIN") {
    return <Redirect to={homeForRole(p.role)} />;
  }
  return <Layout>{children}</Layout>;
}

type RouteDef = [string, () => React.JSX.Element];

function group(roles: Role[], Layout: LayoutComp, routes: RouteDef[]) {
  return routes.map(([path, Page]) => (
    <Route key={path} path={path}>
      {() => (
        <Protected roles={roles} Layout={Layout}>
          <Page />
        </Protected>
      )}
    </Route>
  ));
}

const PARTICIPANT_ROLES: Role[] = ["PARTICIPANT", "ADMIN"];
const ADMIN_ROLES: Role[] = ["ADMIN"];
const TRAINER_ROLES: Role[] = ["TRAINER", "ADMIN"];
const COMPANY_ROLES: Role[] = ["COMPANY_VIEWER", "ADMIN"];

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/invite" component={InvitePage} />
      <Route path="/assessment" component={AssessmentPage} />
      <Route path="/enroll" component={EnrollPage} />
      <Route path="/enroll/confirmation" component={EnrollConfirmationPage} />
      <Route path="/book-a-call" component={BookACallPage} />
      <Route path="/organizations" component={OrganizationsPage} />

      {/* Portal */}
      {group(PARTICIPANT_ROLES, PortalLayout, [
        ["/portal", PortalHome],
        ["/portal/this-week", PortalThisWeek],
        ["/portal/coaching", PortalCoaching],
        ["/portal/library", PortalLibrary],
        ["/portal/materials", PortalMaterials],
        ["/portal/messages", PortalMessages],
        ["/portal/progress", PortalProgress],
        ["/portal/settings", PortalSettings],
        ["/portal/workbook", PortalWorkbook],
        ["/portal/certificate", PortalCertificate],
      ])}

      {/* Admin */}
      {group(ADMIN_ROLES, AdminLayout, [
        ["/admin", AdminHome],
        ["/admin/analytics", AdminAnalytics],
        ["/admin/assessment", AdminAssessment],
        ["/admin/billing", AdminBilling],
        ["/admin/cohorts", AdminCohorts],
        ["/admin/communications", AdminCommunications],
        ["/admin/companies", AdminCompanies],
        ["/admin/content", AdminContent],
        ["/admin/participants", AdminParticipants],
        ["/admin/resources", AdminResources],
        ["/admin/trainers", AdminTrainers],
        ["/admin/users", AdminUsers],
      ])}

      {/* Trainer */}
      {group(TRAINER_ROLES, TrainerLayout, [
        ["/trainer", TrainerHome],
        ["/trainer/events", TrainerEvents],
        ["/trainer/messages", TrainerMessages],
        ["/trainer/resources", TrainerResources],
        ["/trainer/participants", TrainerParticipants],
        ["/trainer/participants/:id", TrainerParticipantDetail],
      ])}

      {/* Company */}
      {group(COMPANY_ROLES, CompanyLayout, [
        ["/company", CompanyHome],
        ["/company/people", CompanyPeople],
      ])}

      {/* Fallback */}
      <Route component={AppNotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
        <SonnerToaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
