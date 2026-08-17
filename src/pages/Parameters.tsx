import PageHeader from '@/components/PageHeader';

export default function Parameters() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8">
      <PageHeader
        breadcrumb={['參數管理']}
        title="參數管理"
        description="全域參數即調即用，也可新增自訂參數或還原預設值。"
      />
    </div>
  );
}
