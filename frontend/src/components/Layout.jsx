import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function Layout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen w-full bg-slate-50 flex">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <TopBar title={title} subtitle={subtitle} />
        <div className="px-6 lg:px-10 py-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
