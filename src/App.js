import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import {
  LayoutDashboard,
  Milk,
  Wallet,
  PawPrint,
  FileSpreadsheet,
  Plus,
  TrendingUp,
  TrendingDown,
  Package,
  RefreshCw,
  Download,
  Menu,
  X,
} from "lucide-react";
import "./App.css";

const API = "/api";
const money = (value) =>
  `PKR ${Number(value || 0).toLocaleString("en-PK")}`;

const litres = (value) =>
  `${Number(value || 0).toLocaleString("en-PK")} L`;

function App() {
  const [page, setPage] = useState("Overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API}/dashboard`);
      setData(response.data);
    } catch (err) {
      console.error(err);
      setError(
        "Could not connect to the farm records server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const navigate = (name) => {
    setPage(name);
    setMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-card">
          <Milk size={42} />
          <h2>SSS Cattle & Dairy Farm</h2>
          <p>Opening the farm ledger…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-loading">
        <div className="loading-card error-card">
          <Milk size={42} />
          <h2>SSS Cattle & Dairy Farm</h2>
          <p>{error}</p>
          <button className="primary-button" onClick={loadDashboard}>
            <RefreshCw size={17} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Milk size={25} />
          </div>
          <div>
            <h1>SSS Cattle & Dairy Farm</h1>
            <span>Farm Management Dashboard</span>
          </div>
        </div>

        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav className={menuOpen ? "nav open" : "nav"}>
          {[
            ["Overview", LayoutDashboard],
            ["Milk production", Milk],
            ["Sales & expenses", Wallet],
            ["Animals & feed", PawPrint],
            ["Reports", FileSpreadsheet],
          ].map(([name, Icon]) => (
            <button
              key={name}
              className={page === name ? "nav-item active" : "nav-item"}
              onClick={() => navigate(name)}
            >
              <Icon size={18} />
              {name}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {page === "Overview" && (
          <Overview
            data={data}
            onNavigate={navigate}
            onRefresh={loadDashboard}
          />
        )}

        {page === "Milk production" && (
          <Production
            records={data.production || []}
            onRefresh={loadDashboard}
          />
        )}

        {page === "Sales & expenses" && (
          <Finance
            records={data.finance || []}
            onRefresh={loadDashboard}
          />
        )}

        {page === "Animals & feed" && (
          <Inventory
            animals={data.animals || {}}
            feed={data.feed || []}
            onRefresh={loadDashboard}
          />
        )}

        {page === "Reports" && <Reports />}
      </main>
    </div>
  );
}

/* =========================
   OVERVIEW
========================= */

function Overview({ data, onNavigate, onRefresh }) {
  const metrics = data.metrics || {};
  const production = data.production || [];

  const chartData = [...production]
    .reverse()
    .map((item) => ({
      date: item.date,
      litres:
        Number(item.morning_litres || 0) +
        Number(item.night_litres || 0),
    }));

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="A quick look at today's farm performance."
        onRefresh={onRefresh}
      />

      <section className="metric-grid">
        <MetricCard
          icon={<Milk />}
          title="Total milk"
          value={litres(metrics.total_litres)}
          description="Recorded production"
        />
        <MetricCard
          icon={<Wallet />}
          title="Sales"
          value={money(metrics.sales)}
          description="Recorded revenue"
        />
        <MetricCard
          icon={<TrendingDown />}
          title="Expenses"
          value={money(metrics.expenses)}
          description="Recorded expenses"
        />
        <MetricCard
          icon={<TrendingUp />}
          title="Profit"
          value={money(metrics.profit)}
          description="Sales minus expenses"
        />
      </section>

      <div className="two-column">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Milk production</h2>
              <p>Recorded litres by production date</p>
            </div>
          </div>

          <div className="chart">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <XAxis dataKey="date" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="litres"
                    strokeWidth={2}
                    fillOpacity={0.15}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState text="No production records yet." />
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Farm snapshot</h2>
              <p>Current inventory</p>
            </div>
          </div>

          <div className="snapshot-list">
            <Snapshot
              icon={<PawPrint />}
              label="Cows"
              value={data.animals?.cows || 0}
            />
            <Snapshot
              icon={<PawPrint />}
              label="Buffaloes"
              value={data.animals?.buffaloes || 0}
            />
            <Snapshot
              icon={<PawPrint />}
              label="Calves"
              value={data.animals?.calves || 0}
            />
            <Snapshot
              icon={<Package />}
              label="Feed items"
              value={(data.feed || []).length}
            />
          </div>

          <div className="rate-box">
            <span>Current milk rate</span>
            <strong>{money(data.milk_rate_pkr)}/L</strong>
          </div>
        </section>
      </div>

      <section className="panel quick-panel">
        <div className="panel-heading">
          <div>
            <h2>Quick actions</h2>
            <p>Jump directly to farm records.</p>
          </div>
        </div>

        <div className="quick-actions">
          <button onClick={() => onNavigate("Milk production")}>
            <Milk />
            Add milk production
          </button>
          <button onClick={() => onNavigate("Sales & expenses")}>
            <Wallet />
            Add sale or expense
          </button>
          <button onClick={() => onNavigate("Animals & feed")}>
            <PawPrint />
            Manage animals & feed
          </button>
          <button onClick={() => onNavigate("Reports")}>
            <FileSpreadsheet />
            Download report
          </button>
        </div>
      </section>
    </>
  );
}

/* =========================
   PRODUCTION
========================= */

function Production({ records, onRefresh }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <PageHeader
        title="Milk production"
        subtitle="Track morning and night milk production."
        action={
          <button
            className="primary-button"
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} />
            Add production
          </button>
        }
      />

      <section className="panel">
        <Table
          headers={["Date", "Morning", "Night", "Total", "Notes"]}
          rows={records.map((r) => {
            const total =
              Number(r.morning_litres || 0) +
              Number(r.night_litres || 0);

            return [
              r.date,
              `${r.morning_litres || 0} L`,
              `${r.night_litres || 0} L`,
              `${total} L`,
              r.notes || "—",
            ];
          })}
          empty="No milk production records yet."
        />
      </section>

      {showForm && (
        <ProductionForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}

function ProductionForm({ onClose, onSaved }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    morning_litres: "",
    night_litres: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      await axios.post(`${API}/production`, {
        ...form,
        morning_litres: Number(form.morning_litres || 0),
        night_litres: Number(form.night_litres || 0),
      });
      onSaved();
    } catch (err) {
      alert("Could not save the production record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add milk production" onClose={onClose}>
      <form onSubmit={submit}>
        <Field
          label="Date"
          type="date"
          value={form.date}
          onChange={(v) => setForm({ ...form, date: v })}
        />
        <Field
          label="Morning litres"
          type="number"
          step="0.1"
          value={form.morning_litres}
          onChange={(v) =>
            setForm({ ...form, morning_litres: v })
          }
        />
        <Field
          label="Night litres"
          type="number"
          step="0.1"
          value={form.night_litres}
          onChange={(v) =>
            setForm({ ...form, night_litres: v })
          }
        />
        <Field
          label="Notes"
          value={form.notes}
          onChange={(v) => setForm({ ...form, notes: v })}
        />

        <FormButtons
          onClose={onClose}
          saving={saving}
          text="Save production"
        />
      </form>
    </Modal>
  );
}

/* =========================
   FINANCE
========================= */

function Finance({ records, onRefresh }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <PageHeader
        title="Sales & expenses"
        subtitle="Keep track of farm income and spending."
        action={
          <button
            className="primary-button"
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} />
            Add transaction
          </button>
        }
      />

      <section className="panel">
        <Table
          headers={[
            "Date",
            "Type",
            "Party",
            "Purpose",
            "Amount",
            "Litres",
            "Rate",
          ]}
          rows={records.map((r) => [
            r.date,
            <span className={`tag ${r.kind === "sale" ? "sale" : "expense"}`}>
              {r.kind}
            </span>,
            r.party || "—",
            r.purpose || "—",
            money(r.amount_pkr),
            r.litres ? `${r.litres} L` : "—",
            r.rate_pkr ? money(r.rate_pkr) : "—",
          ])}
          empty="No financial records yet."
        />
      </section>

      {showForm && (
        <FinanceForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}

function FinanceForm({ onClose, onSaved }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    kind: "sale",
    party: "",
    purpose: "",
    amount_pkr: "",
    litres: "",
    rate_pkr: "",
  });

  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await axios.post(`${API}/finance`, {
        ...form,
        amount_pkr: Number(form.amount_pkr || 0),
        litres: Number(form.litres || 0),
        rate_pkr: Number(form.rate_pkr || 0),
      });

      onSaved();
    } catch (err) {
      alert("Could not save the transaction.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add transaction" onClose={onClose}>
      <form onSubmit={submit}>
        <Field
          label="Date"
          type="date"
          value={form.date}
          onChange={(v) => setForm({ ...form, date: v })}
        />

        <label className="field">
          <span>Type</span>
          <select
            value={form.kind}
            onChange={(e) =>
              setForm({ ...form, kind: e.target.value })
            }
          >
            <option value="sale">Sale</option>
            <option value="expense">Expense</option>
          </select>
        </label>

        <Field
          label="Party"
          value={form.party}
          onChange={(v) => setForm({ ...form, party: v })}
          placeholder="Customer / supplier"
        />

        <Field
          label="Purpose"
          value={form.purpose}
          onChange={(v) => setForm({ ...form, purpose: v })}
          placeholder="Milk sale, feed, medicine, etc."
        />

        <Field
          label="Amount (PKR)"
          type="number"
          value={form.amount_pkr}
          onChange={(v) =>
            setForm({ ...form, amount_pkr: v })
          }
        />

        <Field
          label="Litres"
          type="number"
          step="0.1"
          value={form.litres}
          onChange={(v) => setForm({ ...form, litres: v })}
        />

        <Field
          label="Rate (PKR/L)"
          type="number"
          value={form.rate_pkr}
          onChange={(v) =>
            setForm({ ...form, rate_pkr: v })
          }
        />

        <FormButtons
          onClose={onClose}
          saving={saving}
          text="Save transaction"
        />
      </form>
    </Modal>
  );
}

/* =========================
   INVENTORY
========================= */

function Inventory({ animals, feed, onRefresh }) {
  const [animalForm, setAnimalForm] = useState({
    cows: animals.cows || 0,
    buffaloes: animals.buffaloes || 0,
    calves: animals.calves || 0,
  });

  const [feedForm, setFeedForm] = useState({
    item: "",
    quantity: "",
    unit: "kg",
    reorder_level: "",
  });

  const [savingAnimals, setSavingAnimals] = useState(false);
  const [savingFeed, setSavingFeed] = useState(false);

  const saveAnimals = async (e) => {
    e.preventDefault();

    try {
      setSavingAnimals(true);

      await axios.post(`${API}/animals`, {
        cows: Number(animalForm.cows || 0),
        buffaloes: Number(animalForm.buffaloes || 0),
        calves: Number(animalForm.calves || 0),
      });

      await onRefresh();
      alert("Animal numbers saved.");
    } catch {
      alert("Could not save animal numbers.");
    } finally {
      setSavingAnimals(false);
    }
  };

  const saveFeed = async (e) => {
    e.preventDefault();

    try {
      setSavingFeed(true);

      await axios.post(`${API}/feed`, {
        item: feedForm.item,
        quantity: Number(feedForm.quantity || 0),
        unit: feedForm.unit,
        reorder_level: Number(feedForm.reorder_level || 0),
      });

      setFeedForm({
        item: "",
        quantity: "",
        unit: "kg",
        reorder_level: "",
      });

      await onRefresh();
    } catch {
      alert("Could not save feed item.");
    } finally {
      setSavingFeed(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Animals & feed"
        subtitle="Manage livestock numbers and feed inventory."
      />

      <div className="two-column">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Animals</h2>
              <p>Current livestock count</p>
            </div>
          </div>

          <form onSubmit={saveAnimals}>
            <Field
              label="Cows"
              type="number"
              value={animalForm.cows}
              onChange={(v) =>
                setAnimalForm({ ...animalForm, cows: v })
              }
            />
            <Field
              label="Buffaloes"
              type="number"
              value={animalForm.buffaloes}
              onChange={(v) =>
                setAnimalForm({
                  ...animalForm,
                  buffaloes: v,
                })
              }
            />
            <Field
              label="Calves"
              type="number"
              value={animalForm.calves}
              onChange={(v) =>
                setAnimalForm({ ...animalForm, calves: v })
              }
            />

            <button
              className="primary-button"
              disabled={savingAnimals}
            >
              {savingAnimals ? "Saving…" : "Save animals"}
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Add feed</h2>
              <p>Record a feed inventory item</p>
            </div>
          </div>

          <form onSubmit={saveFeed}>
            <Field
              label="Item"
              value={feedForm.item}
              onChange={(v) =>
                setFeedForm({ ...feedForm, item: v })
              }
              placeholder="Wheat bran"
              required
            />

            <Field
              label="Quantity"
              type="number"
              value={feedForm.quantity}
              onChange={(v) =>
                setFeedForm({ ...feedForm, quantity: v })
              }
              required
            />

            <Field
              label="Unit"
              value={feedForm.unit}
              onChange={(v) =>
                setFeedForm({ ...feedForm, unit: v })
              }
            />

            <Field
              label="Reorder level"
              type="number"
              value={feedForm.reorder_level}
              onChange={(v) =>
                setFeedForm({
                  ...feedForm,
                  reorder_level: v,
                })
              }
            />

            <button
              className="primary-button"
              disabled={savingFeed}
            >
              {savingFeed ? "Saving…" : "Add feed"}
            </button>
          </form>
        </section>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Feed inventory</h2>
            <p>Current stock levels</p>
          </div>
        </div>

        <Table
          headers={["Item", "Quantity", "Unit", "Reorder level", "Status"]}
          rows={feed.map((item) => {
            const low =
              Number(item.quantity || 0) <=
              Number(item.reorder_level || 0);

            return [
              item.item,
              item.quantity,
              item.unit,
              item.reorder_level,
              <span className={`tag ${low ? "expense" : "sale"}`}>
                {low ? "Low stock" : "OK"}
              </span>,
            ];
          })}
          empty="No feed inventory recorded."
        />
      </section>
    </>
  );
}

/* =========================
   REPORTS
========================= */

function Reports() {
  const downloadReport = async () => {
    try {
      const response = await axios.get(`${API}/reports/excel`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = "sss-cattle-dairy-farm-report.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Could not download the Excel report.");
    }
  };

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Download your farm records as an Excel workbook."
      />

      <section className="report-card">
        <div className="report-icon">
          <FileSpreadsheet size={38} />
        </div>

        <div className="report-content">
          <h2>Farm Excel report</h2>
          <p>
            The workbook contains a summary, milk production,
            financial records and inventory information.
          </p>

          <button className="primary-button" onClick={downloadReport}>
            <Download size={18} />
            Download Excel report
          </button>
        </div>
      </section>
    </>
  );
}

/* =========================
   SHARED COMPONENTS
========================= */

function PageHeader({ title, subtitle, action, onRefresh }) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <div className="header-actions">
        {onRefresh && (
          <button className="icon-button" onClick={onRefresh} title="Refresh">
            <RefreshCw size={18} />
          </button>
        )}
        {action}
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, description }) {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>
    </div>
  );
}

function Snapshot({ icon, label, value }) {
  return (
    <div className="snapshot">
      <div className="snapshot-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Table({ headers, rows, empty }) {
  if (!rows.length) {
    return <EmptyState text={empty} />;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="empty">{text}</div>;
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  step,
  required,
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step={step}
        required={required}
      />
    </label>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function FormButtons({ onClose, saving, text }) {
  return (
    <div className="form-buttons">
      <button
        type="button"
        className="secondary-button"
        onClick={onClose}
      >
        Cancel
      </button>

      <button
        type="submit"
        className="primary-button"
        disabled={saving}
      >
        {saving ? "Saving…" : text}
      </button>
    </div>
  );
}

export default App;
