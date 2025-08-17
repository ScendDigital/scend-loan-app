import dynamic from 'next/dynamic';

const TaxTool = dynamic(() => import('../../components/TaxTool'), { ssr: false });

export default function TaxPage() {
  return <TaxTool />;
}
