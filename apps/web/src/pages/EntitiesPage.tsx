import React, { useEffect, useState } from "react";
import { useCase } from "../context/CaseContext";
import { api } from "../api/client";
import { EntityDto, EntityType } from "../types";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Globe,
  Server,
  DollarSign,
  User,
  Building,
  MapPin,
} from "lucide-react";
import { Badge } from "../components/common/Badge";

export const EntitiesPage: React.FC = () => {
  const { activeCase } = useCase();
  const [entities, setEntities] = useState<EntityDto[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const fetchEntities = () => {
    if (activeCase) {
      setIsLoading(true);
      api
        .getEntities(activeCase.id)
        .then(setEntities)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    fetchEntities();
  }, [activeCase]);

  const handleConfirm = async (id: string) => {
    if (!activeCase) return;
    try {
      await api.confirmEntity(activeCase.id, id);
      fetchEntities();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (id: string) => {
    if (!activeCase) return;
    try {
      await api.rejectEntity(activeCase.id, id);
      fetchEntities();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = entities.filter((e) => {
    const matchesSearch =
      e.displayName.toLowerCase().includes(search.toLowerCase()) ||
      e.canonicalValue.toLowerCase().includes(search.toLowerCase()) ||
      (e.description || "").toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "ALL" || e.entityType === typeFilter;
    const matchesStatus = statusFilter === "ALL" || e.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getEntityIcon = (type: EntityType) => {
    switch (type) {
      case "Person":
        return <User className="w-4 h-4 text-sky-400" />;
      case "Organization":
        return <Building className="w-4 h-4 text-purple-400" />;
      case "PhoneNumber":
        return <Phone className="w-4 h-4 text-emerald-400" />;
      case "EmailAddress":
        return <Mail className="w-4 h-4 text-cyan-400" />;
      case "Domain":
        return <Globe className="w-4 h-4 text-amber-400" />;
      case "IPAddress":
        return <Server className="w-4 h-4 text-rose-400" />;
      case "CryptocurrencyWallet":
        return <DollarSign className="w-4 h-4 text-green-400" />;
      case "Location":
        return <MapPin className="w-4 h-4 text-red-400" />;
      default:
        return <Users className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <Users className="w-5 h-5 text-sky-400" />
            <span>Entities & Identifiers</span>
          </h1>
          <p className="text-xs text-slate-400">
            Authoritative entity records, aliases, forensic mentions, and human-in-the-loop review statuses.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center space-x-2">
            <span className="text-slate-400">Total Entities:</span>
            <span className="text-slate-100 font-bold">{entities.length}</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search entity names, identifiers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded px-2.5 py-1 font-mono focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="Person">Person</option>
              <option value="Organization">Organization</option>
              <option value="PhoneNumber">Phone Number</option>
              <option value="EmailAddress">Email Address</option>
              <option value="Domain">Domain</option>
              <option value="IPAddress">IP Address</option>
              <option value="CryptocurrencyWallet">Crypto Wallet</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded px-2.5 py-1 font-mono focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Extracted">Extracted (Pending)</option>
              <option value="Suggested">Suggested</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Entities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading entities...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">No entities found.</div>
        ) : (
          filtered.map((ent) => (
            <div
              key={ent.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                    {getEntityIcon(ent.entityType)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200 text-xs">{ent.displayName}</h3>
                    <span className="text-[10px] font-mono text-slate-400">{ent.entityType}</span>
                  </div>
                </div>

                <Badge
                  variant={
                    ent.status === "Confirmed"
                      ? "confirmed"
                      : ent.status === "Suggested"
                      ? "suggested"
                      : ent.status === "Rejected"
                      ? "danger"
                      : "extracted"
                  }
                >
                  {ent.status}
                </Badge>
              </div>

              {ent.description && (
                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                  {ent.description}
                </p>
              )}

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <div className="flex items-center space-x-3">
                  <span>Mentions: <b className="text-slate-200">{ent.mentionsCount}</b></span>
                  <span>Edges: <b className="text-slate-200">{ent.relationshipsCount}</b></span>
                </div>

                <div className="flex items-center space-x-1.5 font-sans">
                  {ent.status !== "Confirmed" && (
                    <button
                      onClick={() => handleConfirm(ent.id)}
                      title="Confirm Entity"
                      className="px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[10px] font-semibold flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Confirm</span>
                    </button>
                  )}
                  {ent.status !== "Rejected" && (
                    <button
                      onClick={() => handleReject(ent.id)}
                      title="Reject / Flag False Positive"
                      className="px-2 py-0.5 rounded bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[10px] font-semibold flex items-center space-x-1"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Reject</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
