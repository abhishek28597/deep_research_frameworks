import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import CouncilPage from './components/Council/CouncilPage';
import DxOPage from './components/DxO/DxOPage';
import ComingSoon from './components/ComingSoon';
import ErrorBoundary from './components/ErrorBoundary';

function CouncilPageWrapper() {
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('conversation');
  return <CouncilPage selectedConversationId={conversationId} />;
}

function DxOPageWrapper() {
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('conversation');
  return <DxOPage selectedConversationId={conversationId} />;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/council" replace />} />
            <Route path="council" element={<CouncilPageWrapper />} />
            <Route path="super-chat" element={<ComingSoon />} />
            <Route path="dxo" element={<DxOPageWrapper />} />
            <Route path="ensemble" element={<ComingSoon />} />
            <Route path="shoppr" element={<ComingSoon />} />
            <Route path="frontier" element={<ComingSoon />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
