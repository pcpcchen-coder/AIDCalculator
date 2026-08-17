import Hero from '@/components/home/Hero';
import Capabilities from '@/components/home/Capabilities';
import CatalogStats from '@/components/home/CatalogStats';
import DcTypes from '@/components/home/DcTypes';
import RecentDesigns from '@/components/home/RecentDesigns';
import Workflow from '@/components/home/Workflow';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="blueprint-grid">
      <Hero />
      <Capabilities />
      <CatalogStats />
      <DcTypes />
      <RecentDesigns />
      <Workflow />
      <Footer />
    </div>
  );
}
