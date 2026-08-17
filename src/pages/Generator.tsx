import PageHeader from '@/components/PageHeader';

export default function Generator() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8">
      <PageHeader
        breadcrumb={['配置產生器']}
        title="配置產生器"
        description="選類型、給規模、挑冗餘，一鍵產出空間／功率／設備 BOM。"
      />
    </div>
  );
}
