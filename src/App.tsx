import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import CategoryProducts from "./pages/CategoryProducts";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Auth from "./pages/Auth";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import NotFound from "./pages/NotFound";
import AdminCategories from "./pages/AdminCategories";
import MentionsLegales from "./pages/MentionsLegales";
import CGV from "./pages/CGV";
import PolitiqueRetours from "./pages/PolitiqueRetours";
import PolitiqueConfidentialite from "./pages/PolitiqueConfidentialite";
import Livraison from "./pages/Livraison";
import Blog from "./pages/Blog";
import CityPage from "./pages/CityPage";
import CitiesIndex from "./pages/CitiesIndex";
import ImpressionNumerique from "./pages/ImpressionNumerique";
import GrandFormat from "./pages/GrandFormat";
import SupportsPublicitaires from "./pages/SupportsPublicitaires";
import Personnalisation from "./pages/Personnalisation";
import PaymentSuccess from "./pages/PaymentSuccess";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/category/:slug" element={<CategoryProducts />} />
                <Route path="/products/:sku" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
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
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
