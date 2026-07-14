import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FolderTree,
  Heart,
  IndianRupee,
  MailWarning,
  Package,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Users,
  Gift,
  Wallet,
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
} from "lucide-react";
import {
  BarChart as ReBarChart,
  Bar as ReBar,
  LineChart as ReLineChart,
  Line as ReLine,
  XAxis as ReXAxis,
  YAxis as ReYAxis,
  CartesianGrid as ReCartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer as ReResponsiveContainer,
  PieChart as RePieChart,
  Pie as RePie,
  Cell as ReCell,
  Legend as ReLegend,
} from "recharts";
import { useDispatch, useSelector } from "react-redux";
import { selectAllProducts } from "../../store/productsSlice";
import { selectCategories } from "../../store/categoriesSlice";
import { fetchAllOrders, selectAllOrders } from "../../store/ordersSlice";
import Editable from "../../components/editable/Editable";
import { getCategoryDisplayName } from "../../utils/categoryDisplay";
import {
  backendUrl,
  fetchWithAuth as fetchWithAuthRequest,
  readApiResponse,
} from "../../config/api";

const CHART_COLORS = [
  "#1A4B8C",
  "#C8941F",
  "#2E6B5C",
  "#6B1E3C",
  "#914C16",
  "#32679C",
  "#D1A01F",
  "#3E7C6D",
  "#7B2948",
  "#A56022",
  "#285A7E",
  "#5A806A",
  "#9D7A19",
  "#573B78",
];

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

const buildDailyData = (orders) => {
  const days = [];

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    const dayOrders = orders.filter((order) => new Date(order.placedAt).toDateString() === dateStr);

    days.push({
      day: date.toLocaleDateString("en-IN", { weekday: "short" }),
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
    });
  }

  return days;
};

const buildDashboardDailyData = (dashboard, orders) => {
  const apiOrders = dashboard?.charts?.ordersLast7Days;
  const apiRevenue = dashboard?.charts?.revenueLast7Days;

  if (Array.isArray(apiOrders) && apiOrders.length > 0) {
    return apiOrders.map((item, index) => ({
      day: item.day,
      orders: Number(item.orders) || 0,
      revenue: Number(apiRevenue?.[index]?.revenue) || 0,
    }));
  }

  return buildDailyData(orders);
};

const buildCategoryData = (dashboard, products, categories) => {
  const apiCategories = dashboard?.charts?.productsByCategory;

  if (Array.isArray(apiCategories)) {
    const grouped = new Map();
    apiCategories.forEach((item) => {
      const name = item.category && item.category !== "Uncategorized" 
        ? item.category 
        : getCategoryDisplayName(item.categoryId || item.category, categories);
      grouped.set(name, (grouped.get(name) || 0) + (Number(item.totalProducts) || 0));
    });

    return [...grouped]
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }

  const map = {};
  products.forEach((product) => {
    const name = getCategoryDisplayName(product, categories);
    map[name] = (map[name] || 0) + 1;
  });

  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
};

const buildRecentOrders = (dashboard, orders) => {
  const apiOrders = dashboard?.tables?.recentOrders;

  if (Array.isArray(apiOrders)) {
    return apiOrders.map((order) => ({
      id: order.id,
      customer: order.userName || order.userEmail || "Guest",
      itemsCount: Number(order.itemsCount) || 0,
      total: Number(order.totalAmount) || 0,
      payment: order.paymentMethod || "COD",
      status: order.orderStatus || "Pending",
    }));
  }

  return orders.slice(0, 5).map((order) => ({
    id: order.id,
    customer: order.address?.name || "Guest",
    itemsCount: order.items?.length || 0,
    total: Number(order.total) || 0,
    payment: order.paymentMethod || "COD",
    status: order.status || "Pending",
  }));
};

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const allProducts = useSelector(selectAllProducts);
  const categories = useSelector(selectCategories);
  const orders = useSelector(selectAllOrders);
  const [dashboard, setDashboard] = useState(null);
  const [dashboardError, setDashboardError] = useState("");
  const [trafficData, setTrafficData] = useState([]);

  useEffect(() => {
    dispatch(fetchAllOrders());

    let ignore = false;

    const fetchDashboard = async () => {
      try {
        const res = await fetchWithAuthRequest(`${backendUrl}/api/v1/admin/dashboard`);
        const data = await readApiResponse(res);

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch dashboard data");
        }

        if (!ignore) {
          setDashboard(data.dashboard || null);
          setDashboardError("");
        }
      } catch (error) {
        if (!ignore) setDashboardError(error.message);
      }
    };

    const fetchTraffic = async () => {
      try {
        const res = await fetchWithAuthRequest(`${backendUrl}/api/v1/analytics/traffic`);
        const data = await readApiResponse(res);
        if (!ignore && res.ok) {
          // Format date for display
          const formatted = (data.data || []).map(item => ({
            ...item,
            displayDate: new Date(item.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
          }));
          setTrafficData(formatted);
        }
      } catch (error) {
        // Silently ignore traffic fetch errors for now
      }
    };

    fetchDashboard();
    fetchTraffic();

    return () => {
      ignore = true;
    };
  }, [dispatch]);

  const cards = dashboard?.cards || {};
  const totalRevenue = Number(
    cards.totalRevenue ?? orders.reduce((sum, order) => sum + order.total, 0),
  );

  const outOfStockCount = allProducts.filter(p => Number(p.stock) === 0).length;
  const lowStockCount = allProducts.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 5).length;
  const inStockCount = allProducts.filter(p => Number(p.stock) > 5).length;

  const stats = [
    {
      label: "Total Products",
      value: cards.totalProducts ?? allProducts.length,
      icon: Package,
      color: "#1A4B8C",
      key: "admin-stat-products",
    },
    {
      label: "Categories",
      value: cards.totalCategories ?? 0,
      icon: FolderTree,
      color: "#C8941F",
      key: "admin-stat-categories",
    },
    {
      label: "Users",
      value: cards.totalUsers ?? 0,
      icon: Users,
      color: "#2E6B5C",
      key: "admin-stat-users",
    },
    {
      label: "Orders",
      value: cards.totalOrders ?? orders.length,
      icon: ShoppingCart,
      color: "#6B1E3C",
      key: "admin-stat-orders",
    },
    {
      label: "Revenue",
      value: formatCurrency(totalRevenue),
      icon: IndianRupee,
      color: "#1A4B8C",
      key: "admin-stat-revenue",
    },
    {
      label: "Total Referrals",
      value: cards.totalReferrals ?? 0,
      icon: Gift,
      color: "#914C16",
      key: "admin-stat-referrals",
    },
    {
      label: "Credits Issued",
      value: formatCurrency(cards.totalWalletCreditIssued ?? 0),
      icon: Wallet,
      color: "#32679C",
      key: "admin-stat-credits",
    },
    {
      label: "Low Stock",
      value: lowStockCount,
      icon: AlertTriangle,
      color: "#D1A01F",
      key: "admin-stat-low-stock",
    },
    {
      label: "Out of Stock",
      value: outOfStockCount,
      icon: AlertOctagon,
      color: "#7B2948",
      key: "admin-stat-out-of-stock",
    },
    {
      label: "In Stock",
      value: inStockCount,
      icon: CheckCircle,
      color: "#285A7E",
      key: "admin-stat-in-stock",
    },
  ];

  const dailyData = buildDashboardDailyData(dashboard, orders);
  const categoryData = buildCategoryData(dashboard, allProducts, categories);
  const recentOrders = buildRecentOrders(dashboard, orders);

  return (
    <div>
      <Editable
        as="h1"
        id="admin-dashboard-heading"
        kind="button"
        label="Dashboard Heading"
        className="font-display font-semibold text-xl text-gray-900 mb-1"
      >
        Dashboard
      </Editable>
      <Editable
        as="p"
        id="admin-dashboard-subtext"
        kind="button"
        label="Dashboard Subtext"
        className="text-sm text-gray-500 mb-6"
      >
        Welcome back - here's how your store is doing.
      </Editable>

      {dashboardError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2 mb-4">
          Dashboard API: {dashboardError}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <Editable
            key={stat.key}
            as="div"
            kind="button"
            id={stat.key}
            label={`${stat.label} - Stat Card`}
            className="bg-white rounded-md shadow-card p-4"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: `${stat.color}1A` }}
            >
              <stat.icon size={17} style={{ color: stat.color }} />
            </div>
            <Editable
              as="p"
              group="admin-stat-value"
              kind="button"
              label="Stat Value"
              className="text-xl font-semibold text-gray-900"
            >
              {stat.value}
            </Editable>
            <Editable
              as="p"
              group="admin-stat-label"
              kind="button"
              label="Stat Label"
              className="text-xs text-gray-500"
            >
              {stat.label}
            </Editable>
          </Editable>
        ))}
      </div>

      {/* Daily Traffic Chart */}
      {trafficData.length > 0 && (
        <Editable
          as="div"
          kind="button"
          id="admin-chart-traffic"
          label="Daily Traffic Chart Card"
          className="bg-white rounded-md shadow-card p-4 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users size={15} className="text-brand" />
            <Editable
              as="h2"
              group="admin-chart-traffic-title"
              kind="button"
              label="Chart Title"
              className="font-display font-semibold text-sm text-gray-800"
            >
              Daily Website Traffic (Last 30 Days)
            </Editable>
          </div>
          <div className="h-64">
            <ReResponsiveContainer width="100%" height="100%">
              <ReLineChart data={trafficData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <ReLine type="monotone" dataKey="totalUsers" stroke="#1A4B8C" name="Total Visitors" strokeWidth={3} dot={{r: 4}} />
                <ReLine type="monotone" dataKey="newUsers" stroke="#2E6B5C" name="New Visitors" strokeWidth={2} dot={{r: 3}} />
                <ReLine type="monotone" dataKey="returningUsers" stroke="#C8941F" name="Returning" strokeWidth={2} dot={{r: 3}} />
                <ReCartesianGrid stroke="#ccc" strokeDasharray="5 5" opacity={0.3} />
                <ReXAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
                <ReYAxis tick={{ fontSize: 11 }} />
                <ReTooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                <ReLegend />
              </ReLineChart>
            </ReResponsiveContainer>
          </div>
        </Editable>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Editable
          as="div"
          kind="button"
          id="admin-chart-orders"
          label="Orders Chart Card"
          className="bg-white rounded-md shadow-card p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} className="text-brand" />
            <Editable
              as="h3"
              id="admin-chart-orders-title"
              kind="button"
              label="Orders Chart Title"
              className="font-semibold text-gray-900 text-sm"
            >
              Orders - Last 7 Days
            </Editable>
          </div>
          <ReResponsiveContainer width="100%" height={180}>
            <ReBarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <ReCartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <ReXAxis dataKey="day" tick={{ fontSize: 11 }} />
              <ReYAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <ReTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [v, "Orders"]} />
              <ReBar dataKey="orders" fill="#1A4B8C" radius={[4, 4, 0, 0]} />
            </ReBarChart>
          </ReResponsiveContainer>
        </Editable>

        <Editable
          as="div"
          kind="button"
          id="admin-chart-revenue"
          label="Revenue Chart Card"
          className="bg-white rounded-md shadow-card p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <IndianRupee size={15} className="text-brand" />
            <Editable
              as="h3"
              id="admin-chart-revenue-title"
              kind="button"
              label="Revenue Chart Title"
              className="font-semibold text-gray-900 text-sm"
            >
              Revenue - Last 7 Days
            </Editable>
          </div>
          <ReResponsiveContainer width="100%" height={180}>
            <ReLineChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <ReCartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <ReXAxis dataKey="day" tick={{ fontSize: 11 }} />
              <ReYAxis tick={{ fontSize: 11 }} />
              <ReTooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v) => [formatCurrency(v), "Revenue"]}
              />
              <ReLine
                type="monotone"
                dataKey="revenue"
                stroke="#C8941F"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </ReLineChart>
          </ReResponsiveContainer>
        </Editable>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Editable
          as="div"
          kind="button"
          id="admin-chart-category"
          label="Category Chart Card"
          className="bg-white rounded-md shadow-card p-4"
        >
          <Editable
            as="h3"
            id="admin-chart-category-title"
            kind="button"
            label="Category Chart Title"
            className="font-semibold text-gray-900 text-sm mb-4"
          >
            Products by Category
          </Editable>
          {categoryData.length > 0 ? (
            <ReResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <RePie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="42%"
                  outerRadius={88}
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {categoryData.map((_, index) => (
                    <ReCell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </RePie>
                <ReTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <ReLegend
                  verticalAlign="bottom"
                  align="center"
                  iconType="square"
                  iconSize={10}
                  wrapperStyle={{ fontSize: 11, lineHeight: "18px", paddingTop: 10 }}
                />
              </RePieChart>
            </ReResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No products yet.</p>
          )}
        </Editable>

        <Editable
          as="div"
          kind="button"
          id="admin-recent-orders-card"
          label="Recent Orders Card Background"
          className="bg-white rounded-md shadow-card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <Editable
              as="h3"
              id="admin-recent-orders-heading"
              kind="button"
              label="Recent Orders Heading"
              className="font-semibold text-gray-900 text-sm"
            >
              Recent Orders
            </Editable>
            <Editable
              as={Link}
              to="/admin/orders"
              kind="button"
              id="admin-view-all-btn"
              label="View All Orders Link"
              className="text-brand text-sm font-medium hover:underline"
            >
              View All
            </Editable>
          </div>
          {recentOrders.length === 0 ? (
            <Editable
              as="p"
              id="admin-no-orders-text"
              kind="button"
              label="No Orders Text"
              className="text-sm text-gray-500 py-6 text-center"
            >
              No orders yet.
            </Editable>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <Editable as="th" group="admin-table-header" kind="button" label="Table Header" className="py-2">
                    Order ID
                  </Editable>
                  <Editable as="th" group="admin-table-header" kind="button" label="Table Header" className="py-2">
                    Customer
                  </Editable>
                  <Editable as="th" group="admin-table-header" kind="button" label="Table Header" className="py-2">
                    Items
                  </Editable>
                  <Editable as="th" group="admin-table-header" kind="button" label="Table Header" className="py-2">
                    Total
                  </Editable>
                  <Editable as="th" group="admin-table-header" kind="button" label="Table Header" className="py-2">
                    Payment
                  </Editable>
                  <Editable as="th" group="admin-table-header" kind="button" label="Table Header" className="py-2">
                    Status
                  </Editable>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50">
                    <Editable as="td" group="admin-table-cell" kind="button" label="Table Cell" className="py-2.5 text-gray-700">
                      #{String(order.id).slice(-8)}
                    </Editable>
                    <Editable as="td" group="admin-table-cell" kind="button" label="Table Cell" className="py-2.5 text-gray-600">
                      {order.customer}
                    </Editable>
                    <Editable as="td" group="admin-table-cell" kind="button" label="Table Cell" className="py-2.5 text-gray-600">
                      {order.itemsCount}
                    </Editable>
                    <Editable as="td" group="admin-table-cell" kind="button" label="Table Cell" className="py-2.5 text-gray-900 font-medium">
                      {formatCurrency(order.total)}
                    </Editable>
                    <Editable as="td" group="admin-table-cell" kind="button" label="Table Cell" className="py-2.5 text-gray-600 uppercase text-xs">
                      {order.payment}
                    </Editable>
                    <td className="py-2.5">
                      <Editable
                        as="span"
                        kind="button"
                        group="admin-order-status-badge"
                        label="Order Status Badge"
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
                      >
                        {order.status}
                      </Editable>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </Editable>
      </div>
    </div>
  );
}
