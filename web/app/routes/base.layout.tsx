import { Outlet, useMatches } from "react-router";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { MessageProvider } from "@/translation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const q = new QueryClient();

export default function Page() {
  const matches = useMatches();
  const pageName = matches
    .filter((m) => m.handle)
    .map((m) => (m.handle as { pageName: string }).pageName)
    .join(" / ");

  return (
    <>
      <QueryClientProvider client={q}>
        <MessageProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbPage>{pageName}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
              </header>
              <div className="flex flex-1 flex-col px-6 gap-4">
                <div>
                  <Outlet />
                </div>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </MessageProvider>
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="top-right"
          position="bottom"
        />
      </QueryClientProvider>
    </>
  );
}
