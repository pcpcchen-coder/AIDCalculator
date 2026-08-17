import PageHeader from '@/components/PageHeader';

export default function Docs() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8">
      <PageHeader
        breadcrumb={['模型說明']}
        title="模型說明"
        description="DCGen 方法論、四種 DC 類型、冗餘語彙、資料來源與引用。"
      />
    </div>
  );
}
