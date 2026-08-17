import PageHeader from '@/components/PageHeader';

export default function Algorithms() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8">
      <PageHeader
        breadcrumb={['算法管理']}
        title="算法管理"
        description="論文式 1–19 註冊表、參數調整、自訂算法新增與公式試算。"
      />
    </div>
  );
}
