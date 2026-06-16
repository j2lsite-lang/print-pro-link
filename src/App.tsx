import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";

// Lazy-loaded routes — split into on-demand chunks to reduce the main bundle
// and Total Blocking Time. The homepage (Index) stays eager for fast first paint.
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const CategoryProducts = lazy(() => import("./pages/CategoryProducts"));
const Themes = lazy(() => import("./pages/Themes"));
const ThemeProducts = lazy(() => import("./pages/ThemeProducts"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Auth = lazy(() => import("./pages/Auth"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminCategories = lazy(() => import("./pages/AdminCategories"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const CGV = lazy(() => import("./pages/CGV"));
const PolitiqueRetours = lazy(() => import("./pages/PolitiqueRetours"));
const PolitiqueConfidentialite = lazy(() => import("./pages/PolitiqueConfidentialite"));
const Livraison = lazy(() => import("./pages/Livraison"));
const Blog = lazy(() => import("./pages/Blog"));
const CityPage = lazy(() => import("./pages/CityPage"));
const CitiesIndex = lazy(() => import("./pages/CitiesIndex"));
const ImpressionNumerique = lazy(() => import("./pages/ImpressionNumerique"));
const GrandFormat = lazy(() => import("./pages/GrandFormat"));
const SupportsPublicitaires = lazy(() => import("./pages/SupportsPublicitaires"));
const Personnalisation = lazy(() => import("./pages/Personnalisation"));
const SeoRoute = lazy(() => import("./pages/SeoRoute"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const WorkerDiagnostic = lazy(() => import("./pages/WorkerDiagnostic"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={null}>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/category/:slug" element={<CategoryProducts />} />
                  <Route path="/themes" element={<Themes />} />
                  <Route path="/themes/:slug" element={<ThemeProducts />} />
                  <Route path="/products/:sku" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/account/orders" element={<Orders />} />
                  <Route path="/account/orders/:orderNumber" element={<OrderDetail />} />
                  <Route path="/admin/categories" element={<AdminCategories />} />
                  <Route path="/mentions-legales" element={<MentionsLegales />} />
                  <Route path="/cgv" element={<CGV />} />
                  <Route path="/politique-retours" element={<PolitiqueRetours />} />
                  <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
                  <Route path="/livraison" element={<Livraison />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/impression-numerique" element={<ImpressionNumerique />} />
                  <Route path="/grand-format" element={<GrandFormat />} />
                  <Route path="/supports-publicitaires" element={<SupportsPublicitaires />} />
                  <Route path="/personnalisation" element={<Personnalisation />} />
                  <Route path="/imprimerie" element={<CitiesIndex />} />
                  <Route path="/imprimerie/:slug" element={<CityPage />} />
                  {/* New SEO routes (prerendered content, shared model) */}
                  <Route path="/catalogue" element={<SeoRoute />} />
                  <Route path="/categorie/:slug" element={<SeoRoute />} />
                  <Route path="/categorie/:parent/:child" element={<SeoRoute />} />
                  <Route path="/ville/:slug" element={<SeoRoute />} />
                  <Route path="/departement/:slug" element={<SeoRoute />} />
                  <Route path="/region/:slug" element={<SeoRoute />} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />
                  <Route path="/__worker" element={<WorkerDiagnostic />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
