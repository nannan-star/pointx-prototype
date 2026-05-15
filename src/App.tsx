import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import ClientLayout from './layouts/ClientLayout'
import { optionById, readStoredDemoPersona } from './lib/demo-persona'
import SdkResourcesPage from './pages/admin/SdkResourcesPage'
import CorsResourcesPage from './pages/admin/CorsResourcesPage'
import ServiceNodesPage from './pages/admin/ServiceNodesPage'
import ServicePackagesPage from './pages/admin/ServicePackagesPage'
import ProductsPage from './pages/admin/ProductsPage'
import SpecsPage from './pages/admin/SpecsPage'
import InstancesPage from './pages/admin/InstancesPage'
import OrderDetailPage from './pages/admin/OrderDetailPage'
import OrdersPage from './pages/admin/OrdersPage'
import AdminUsersPage from './pages/admin/system/AdminUsersPage'
import RoleManagementPage from './pages/admin/system/RoleManagementPage'
import MenuManagementPage from './pages/admin/system/MenuManagementPage'
import DictManagementPage from './pages/admin/system/DictManagementPage'
import AdminProfilePage from './pages/admin/system/AdminProfilePage'
import EnterprisesPage from './pages/admin/system/EnterprisesPage'
import EnterpriseDetailPage from './pages/admin/system/EnterpriseDetailPage'
import InstanceDetailPage from './pages/admin/resources/InstanceDetailPage'
import PoolPage from './pages/admin/resources/PoolPage'
import DashboardPage from './pages/client/DashboardPage'
import ResourceInfoPage from './pages/client/ResourceInfoPage'
import ReconciliationPage from './pages/client/trade/ReconciliationPage'
import ClientProfilePage from './pages/client/ClientProfilePage'
import ModuleDocsPage from './pages/ModuleDocsPage'

function DemoEntryRedirect() {
  const to = optionById(readStoredDemoPersona()).homePath
  return <Navigate to={to} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="instances" replace />} />
        <Route path="enterprises" element={<EnterprisesPage />} />
        <Route path="enterprises/:id" element={<EnterpriseDetailPage />} />
        <Route path="instances" element={<InstancesPage />} />
        <Route path="instances/detail" element={<InstanceDetailPage />} />
        <Route path="pool" element={<PoolPage />} />
        <Route path="resources/sdk" element={<SdkResourcesPage />} />
        <Route path="resources/cors" element={<CorsResourcesPage />} />
        <Route path="trade/orders" element={<OrdersPage />} />
        <Route path="trade/detail" element={<OrderDetailPage />} />
        <Route path="config/nodes" element={<ServiceNodesPage />} />
        <Route path="config/packages" element={<ServicePackagesPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="specs" element={<SpecsPage />} />
        <Route path="system/admins" element={<AdminUsersPage />} />
        <Route path="system/roles" element={<RoleManagementPage />} />
        <Route path="system/menus" element={<MenuManagementPage />} />
        <Route path="system/dict" element={<DictManagementPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
        <Route path="module-docs" element={<ModuleDocsPage />} />
      </Route>

      <Route path="/client" element={<ClientLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="resource/info" element={<ResourceInfoPage />} />
        <Route path="resource/sdk" element={<SdkResourcesPage isClientView />} />
        <Route path="resource/cors" element={<CorsResourcesPage isClientView />} />
        <Route path="trade/orders" element={<OrdersPage />} />
        <Route path="trade/detail" element={<OrderDetailPage />} />
        <Route path="trade/reconciliation" element={<ReconciliationPage />} />
        <Route path="profile" element={<ClientProfilePage />} />
        <Route path="module-docs" element={<ModuleDocsPage />} />
      </Route>

      <Route path="*" element={<DemoEntryRedirect />} />
    </Routes>
  )
}
