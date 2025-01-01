import { createBrowserRouter } from "react-router-dom";
import { Applayout } from "./components/layouts/AppLayout";
import NoMatch from "./pages/NoMatch";
import Dashboard from "./pages/Dashboard";
import AddCashbookEntry from "./newCashbookEntry";
import { CashbookForm } from "./components/cashbook-form";
import CashbookEntryForm from "./pages/CashbookEntry";
import Cashbook from "./Cashbook";
import { DashboardWrapper } from "./components/DashboardWrapper";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Applayout />,
    children: [
      {
        path: "",
        element: <Dashboard />,
      },
      {
        path: "add-cashbook-entry",
        element: <AddCashbookEntry />,
      },
      {
        path: "add-entry",
        element: <AddCashbookEntry />,
      },
      {
        path: "transactions/cashbook/:voucherType",
        element: <CashbookEntryForm />,
      },
      {
        path: "reports/cashbook",
        element: <Cashbook />,
      },
    ],
  },
  {
    path: "*",
    element: <NoMatch />,
  },
]);

