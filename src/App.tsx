import { Routes, Route } from 'react-router';
import { Toaster } from 'sonner';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Generator from '@/pages/Generator';
import LayoutStudio from '@/pages/LayoutStudio';
import Catalog from '@/pages/Catalog';
import Parameters from '@/pages/Parameters';
import Algorithms from '@/pages/Algorithms';
import Docs from '@/pages/Docs';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/generator" element={<Generator />} />
        <Route path="/layout" element={<LayoutStudio />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/parameters" element={<Parameters />} />
        <Route path="/algorithms" element={<Algorithms />} />
        <Route path="/docs" element={<Docs />} />
      </Routes>
      <Toaster theme="dark" position="top-right" richColors closeButton />
    </Layout>
  );
}
