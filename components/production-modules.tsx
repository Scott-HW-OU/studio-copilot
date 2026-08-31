"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Edit3, MapPin, Plus, Save, Trash2, Users, X } from "lucide-react";
import { useAuth } from "./auth-provider";
import type { CrewMember, ProductionLocation, ShootDay } from "@/lib/types";

const productionId = "north-star";
type Resource = "crew" | "locations" | "schedule";

async function responseError(response: Response) {
  const body = await response.json().catch(() => ({}));
  return body.error || `Request failed (${response.status}).`;
}

export function ProductionModules() {
  const { token } = useAuth();
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [locations, setLocations] = useState<ProductionLocation[]>([]);
  const [schedule, setSchedule] = useState<ShootDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<{ resource: Resource; id?: string } | null>(null);

  const api = useCallback(async (resource: Resource, options?: RequestInit, id?: string) => {
    const authToken = await token();
    const response = await fetch(`/api/productions/${productionId}/${resource}${id ? `/${id}` : ""}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}`, ...options?.headers }
    });
    if (!response.ok) throw new Error(await responseError(response));
    return response.status === 204 ? null : response.json();
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [crewData, locationData, scheduleData] = await Promise.all([
        api("crew"), api("locations"), api("schedule")
      ]);
      setCrew(crewData.items); setLocations(locationData.items); setSchedule(scheduleData.items);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load production records."); }
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => {
    let active = true;
    Promise.all([api("crew"), api("locations"), api("schedule")])
      .then(([crewData, locationData, scheduleData]) => {
        if (!active) return;
        setCrew(crewData.items); setLocations(locationData.items); setSchedule(scheduleData.items);
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load production records."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [api]);

  async function save(resource: Resource, value: object, id?: string) {
    setError("");
    try {
      await api(resource, { method: id ? "PATCH" : "POST", body: JSON.stringify(value) }, id);
      setEditor(null); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save record."); }
  }

  async function remove(resource: Resource, id: string) {
    if (!window.confirm("Delete this record? This cannot be undone.")) return;
    setError("");
    try { await api(resource, { method: "DELETE" }, id); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete record."); }
  }

  if (loading) return <section className="module-loading">Loading production modules…</section>;

  return <section className="modules" aria-label="Production management modules">
    {error && <div className="error-banner" role="alert">{error}</div>}

    <article className="module-card" id="schedule-module">
      <ModuleHeading icon={<CalendarDays />} eyebrow="SCHEDULING MODULE" title="Shoot schedule" onAdd={() => setEditor({ resource: "schedule" })} />
      <div className="record-list">
        {[...schedule].sort((a, b) => a.date.localeCompare(b.date)).map((day) => <div className="record-row" key={day.id}>
          <div className="record-date"><strong>{new Date(`${day.date}T12:00:00`).getDate()}</strong><span>{new Date(`${day.date}T12:00:00`).toLocaleString("en-GB", { month: "short" })}</span></div>
          <div className="record-primary"><strong>{day.title}</strong><span><MapPin size={12} />{day.location}</span></div>
          <div className="record-meta"><span>{day.type}</span><span>{day.scenes.length} scenes</span><span>{day.crewIds.length} crew</span></div>
          <RowActions onEdit={() => setEditor({ resource: "schedule", id: day.id })} onDelete={() => remove("schedule", day.id)} />
        </div>)}
        {!schedule.length && <Empty text="No shoot days scheduled." />}
      </div>
    </article>

    <article className="module-card" id="crew-module">
      <ModuleHeading icon={<Users />} eyebrow="CREW MODULE" title="Crew directory" onAdd={() => setEditor({ resource: "crew" })} />
      <div className="record-grid">
        {crew.map((member) => <div className="person-card" key={member.id}>
          <span className="person-avatar">{member.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
          <div><strong>{member.name}</strong><span>{member.role}</span><small>{member.email || "No email"} · £{member.dayRate}/day</small></div>
          <RowActions onEdit={() => setEditor({ resource: "crew", id: member.id })} onDelete={() => remove("crew", member.id)} />
        </div>)}
        {!crew.length && <Empty text="No crew members added." />}
      </div>
    </article>

    <article className="module-card" id="locations-module">
      <ModuleHeading icon={<MapPin />} eyebrow="LOCATIONS MODULE" title="Location directory" onAdd={() => setEditor({ resource: "locations" })} />
      <div className="record-grid locations-grid">
        {locations.map((location) => <div className="location-card" key={location.id}>
          <div className="location-pin"><MapPin size={18} /></div>
          <div><strong>{location.name}</strong><span>{location.address}, {location.city}, {location.postcode}</span><small>{location.contactName || "No location contact"}</small></div>
          <RowActions onEdit={() => setEditor({ resource: "locations", id: location.id })} onDelete={() => remove("locations", location.id)} />
        </div>)}
        {!locations.length && <Empty text="No locations added." />}
      </div>
    </article>

    {editor?.resource === "crew" && <CrewEditor value={crew.find((item) => item.id === editor.id)} onClose={() => setEditor(null)} onSave={(value) => save("crew", value, editor.id)} />}
    {editor?.resource === "locations" && <LocationEditor value={locations.find((item) => item.id === editor.id)} onClose={() => setEditor(null)} onSave={(value) => save("locations", value, editor.id)} />}
    {editor?.resource === "schedule" && <ScheduleEditor value={schedule.find((item) => item.id === editor.id)} locations={locations} crew={crew} onClose={() => setEditor(null)} onSave={(value) => save("schedule", value, editor.id)} />}
  </section>;
}

function ModuleHeading({ icon, eyebrow, title, onAdd }: { icon: React.ReactNode; eyebrow: string; title: string; onAdd: () => void }) {
  return <div className="module-heading"><div className="module-icon">{icon}</div><div><small>{eyebrow}</small><h2>{title}</h2></div><button onClick={onAdd}><Plus size={15} />Add new</button></div>;
}
function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="row-actions"><button onClick={onEdit} aria-label="Edit"><Edit3 size={14} /></button><button className="delete" onClick={onDelete} aria-label="Delete"><Trash2 size={14} /></button></div>;
}
function Empty({ text }: { text: string }) { return <p className="empty-state">{text}</p>; }

function Editor({ title, children, onClose, onSubmit }: { title: string; children: React.ReactNode; onClose: () => void; onSubmit: (event: React.FormEvent) => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="editor-modal" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <div className="editor-heading"><h2 id="editor-title">{title}</h2><button type="button" onClick={onClose} aria-label="Close"><X /></button></div>
      <form onSubmit={onSubmit}>{children}<div className="editor-actions"><button type="button" onClick={onClose}>Cancel</button><button className="primary" type="submit"><Save size={15} />Save changes</button></div></form>
    </section>
  </div>;
}

function CrewEditor({ value, onClose, onSave }: { value?: CrewMember; onClose: () => void; onSave: (value: object) => void }) {
  const [form, setForm] = useState({ name: value?.name || "", role: value?.role || "", email: value?.email || "", phone: value?.phone || "", dayRate: value?.dayRate || 0, available: value?.available.join(", ") || "", notes: value?.notes || "" });
  return <Editor title={value ? "Edit crew member" : "Add crew member"} onClose={onClose} onSubmit={(event) => { event.preventDefault(); onSave({ ...form, available: form.available.split(",").map((item) => item.trim()).filter(Boolean) }); }}>
    <div className="form-grid"><Field label="Full name"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Role"><input required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></Field><Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field><Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field><Field label="Day rate (£)"><input required type="number" min="0" value={form.dayRate} onChange={(e) => setForm({ ...form, dayRate: Number(e.target.value) })} /></Field><Field label="Available dates (comma separated)"><input placeholder="2026-09-03, 2026-09-05" value={form.available} onChange={(e) => setForm({ ...form, available: e.target.value })} /></Field><Field wide label="Notes"><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
  </Editor>;
}

function LocationEditor({ value, onClose, onSave }: { value?: ProductionLocation; onClose: () => void; onSave: (value: object) => void }) {
  const [form, setForm] = useState({ name: value?.name || "", address: value?.address || "", city: value?.city || "", postcode: value?.postcode || "", contactName: value?.contactName || "", contactPhone: value?.contactPhone || "", notes: value?.notes || "" });
  const input = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: event.target.value });
  return <Editor title={value ? "Edit location" : "Add location"} onClose={onClose} onSubmit={(event) => { event.preventDefault(); onSave(form); }}><div className="form-grid"><Field label="Location name"><input required value={form.name} onChange={input("name")} /></Field><Field label="Street address"><input required value={form.address} onChange={input("address")} /></Field><Field label="City"><input required value={form.city} onChange={input("city")} /></Field><Field label="Postcode"><input required value={form.postcode} onChange={input("postcode")} /></Field><Field label="Contact name"><input value={form.contactName} onChange={input("contactName")} /></Field><Field label="Contact phone"><input value={form.contactPhone} onChange={input("contactPhone")} /></Field><Field wide label="Access notes"><textarea value={form.notes} onChange={input("notes")} /></Field></div></Editor>;
}

function ScheduleEditor({ value, locations, crew, onClose, onSave }: { value?: ShootDay; locations: ProductionLocation[]; crew: CrewMember[]; onClose: () => void; onSave: (value: object) => void }) {
  const [form, setForm] = useState({ date: value?.date || "", title: value?.title || "", locationId: value?.locationId || locations[0]?.id || "", type: value?.type || "Exterior", scenes: value?.scenes.join(", ") || "", crewIds: value?.crewIds || [], equipmentDailyCost: value?.equipmentDailyCost || 0 });
  return <Editor title={value ? "Edit shoot day" : "Schedule shoot day"} onClose={onClose} onSubmit={(event) => { event.preventDefault(); onSave({ ...form, scenes: form.scenes.split(",").map((item) => item.trim()).filter(Boolean) }); }}><div className="form-grid"><Field label="Date"><input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field><Field label="Shoot title"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field><Field label="Location"><select required value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></Field><Field label="Unit type"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "Interior" | "Exterior" })}><option>Exterior</option><option>Interior</option></select></Field><Field label="Scenes (comma separated)"><input required value={form.scenes} onChange={(e) => setForm({ ...form, scenes: e.target.value })} /></Field><Field label="Equipment cost (£)"><input required type="number" min="0" value={form.equipmentDailyCost} onChange={(e) => setForm({ ...form, equipmentDailyCost: Number(e.target.value) })} /></Field><fieldset className="crew-picker"><legend>Assigned crew</legend>{crew.map((member) => <label key={member.id}><input type="checkbox" checked={form.crewIds.includes(member.id)} onChange={(e) => setForm({ ...form, crewIds: e.target.checked ? [...form.crewIds, member.id] : form.crewIds.filter((id) => id !== member.id) })} />{member.name}<small>{member.role}</small></label>)}</fieldset></div></Editor>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <label className={wide ? "form-field wide" : "form-field"}><span>{label}</span>{children}</label>; }
