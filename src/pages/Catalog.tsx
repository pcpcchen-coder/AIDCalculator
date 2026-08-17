import PageHeader from '@/components/PageHeader';

export default function Catalog() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8">
      <PageHeader
        breadcrumb={['資料庫管理']}
        title="資料庫管理"
        description="IT 參考配置與 8 類非 IT 設備型錄的瀏覽、篩選、新增、編輯與刪除。"
      />
    </div>
  );
}
