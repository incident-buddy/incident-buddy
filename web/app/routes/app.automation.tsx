import WorkflowTable from "../components/workflow-table";

export const handle = {
  pageName: "オートメーション",
};

export default function Page() {
  return (
    <>
      <WorkflowTable></WorkflowTable>
    </>
  );
}
