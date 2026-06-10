"use client";
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ClientOrderClient;
var react_1 = require("react");
var button_1 = require("@/components/ui/button");
var input_1 = require("@/components/ui/input");
var textarea_1 = require("@/components/ui/textarea");
var card_1 = require("@/components/ui/card");
var badge_1 = require("@/components/ui/badge");
var sonner_1 = require("sonner");
var lucide_react_1 = require("lucide-react");
var countries_1 = require("@/data/countries");
var AVAILABILITY_CONFIG = {
    available: {
        label: "IN STOCK",
        color: "bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
    },
    limited_stock: {
        label: "LIMITED",
        color: "bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
    },
    out_of_stock: {
        label: "UNAVAILABLE",
        color: "bg-red-50 text-red-700",
        dot: "bg-red-500",
    },
    seasonal: {
        label: "SEASONAL",
        color: "bg-sky-50 text-sky-700",
        dot: "bg-sky-500",
    },
    on_request: {
        label: "ON REQUEST",
        color: "bg-slate-50 text-slate-600",
        dot: "bg-slate-400",
    },
};
function ClientOrderClient(_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    var priceList = _a.priceList;
    var _m = (0, react_1.useState)([
        { id: 1, name: "Order A", items: {} },
    ]), groups = _m[0], setGroups = _m[1];
    var _o = (0, react_1.useState)(1), activeGroupId = _o[0], setActiveGroupId = _o[1];
    var _p = (0, react_1.useState)(false), submitted = _p[0], setSubmitted = _p[1];
    var _q = (0, react_1.useState)(false), submitting = _q[0], setSubmitting = _q[1];
    var _r = (0, react_1.useState)(""), orderRef = _r[0], setOrderRef = _r[1];
    // Phone & country state
    var defaultCountry = countries_1.COUNTRIES.find(function (c) { var _a; return c.name === ((_a = priceList.client) === null || _a === void 0 ? void 0 : _a.country); });
    var _s = (0, react_1.useState)(defaultCountry !== null && defaultCountry !== void 0 ? defaultCountry : countries_1.COUNTRIES.find(function (c) { return c.code === "NG"; })), selectedCountry = _s[0], setSelectedCountry = _s[1];
    var _t = (0, react_1.useState)((_d = (_c = (_b = priceList.client) === null || _b === void 0 ? void 0 : _b.phone) === null || _c === void 0 ? void 0 : _c.replace(/^\+\d+\s?/, "")) !== null && _d !== void 0 ? _d : ""), phoneNumber = _t[0], setPhoneNumber = _t[1];
    var _u = (0, react_1.useState)(""), countrySearch = _u[0], setCountrySearch = _u[1];
    var _v = (0, react_1.useState)(false), countryDropdownOpen = _v[0], setCountryDropdownOpen = _v[1];
    var _w = (0, react_1.useState)(false), phoneCodeOpen = _w[0], setPhoneCodeOpen = _w[1];
    var countryRef = (0, react_1.useRef)(null);
    var phoneCodeRef = (0, react_1.useRef)(null);
    // Close dropdowns on outside click
    (0, react_1.useEffect)(function () {
        function handleClick(e) {
            if (countryRef.current &&
                !countryRef.current.contains(e.target)) {
                setCountryDropdownOpen(false);
            }
            if (phoneCodeRef.current &&
                !phoneCodeRef.current.contains(e.target)) {
                setPhoneCodeOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return function () { return document.removeEventListener("mousedown", handleClick); };
    }, []);
    var activeGroup = groups.find(function (g) { return g.id === activeGroupId; });
    // Filters
    var _x = (0, react_1.useState)("all"), availabilityFilter = _x[0], setAvailabilityFilter = _x[1];
    var _y = (0, react_1.useState)("all"), classFilter = _y[0], setClassFilter = _y[1];
    var classOptions = (0, react_1.useMemo)(function () {
        var _a, _b, _c;
        var setOpts = new Set();
        for (var _i = 0, _d = priceList.items; _i < _d.length; _i++) {
            var it = _d[_i];
            var cls = ((_a = it.species) === null || _a === void 0 ? void 0 : _a.class) || ((_c = (_b = it.species) === null || _b === void 0 ? void 0 : _b.category) === null || _c === void 0 ? void 0 : _c.name) || "Unspecified";
            setOpts.add(cls);
        }
        return Array.from(setOpts);
    }, [priceList.items]);
    var filteredItems = (0, react_1.useMemo)(function () {
        return priceList.items.filter(function (item) {
            var _a;
            var sp = item.species || {};
            var avail = sp.availability || "on_request";
            var cls = sp.class || ((_a = sp.category) === null || _a === void 0 ? void 0 : _a.name) || "Unspecified";
            if (availabilityFilter !== "all" && availabilityFilter !== avail)
                return false;
            if (classFilter !== "all" && classFilter !== cls)
                return false;
            return true;
        });
    }, [priceList.items, availabilityFilter, classFilter]);
    function setPieces(speciesId, pieces, qtyPerBox) {
        setGroups(function (prev) {
            return prev.map(function (g) {
                var _a;
                if (g.id !== activeGroupId)
                    return g;
                if (pieces <= 0) {
                    var _b = g.items, _c = speciesId, _ = _b[_c], rest = __rest(_b, [typeof _c === "symbol" ? _c : _c + ""]);
                    return __assign(__assign({}, g), { items: rest });
                }
                return __assign(__assign({}, g), { items: __assign(__assign({}, g.items), (_a = {}, _a[speciesId] = {
                        pieces: pieces,
                        boxes: parseFloat((pieces / qtyPerBox).toFixed(2)),
                    }, _a)) });
            });
        });
    }
    function setBoxes(speciesId, boxes, qtyPerBox) {
        setGroups(function (prev) {
            return prev.map(function (g) {
                var _a;
                if (g.id !== activeGroupId)
                    return g;
                var pieces = Math.round(boxes * qtyPerBox);
                if (pieces <= 0) {
                    var _b = g.items, _c = speciesId, _ = _b[_c], rest = __rest(_b, [typeof _c === "symbol" ? _c : _c + ""]);
                    return __assign(__assign({}, g), { items: rest });
                }
                return __assign(__assign({}, g), { items: __assign(__assign({}, g.items), (_a = {}, _a[speciesId] = { pieces: pieces, boxes: parseFloat(boxes.toFixed(2)) }, _a)) });
            });
        });
    }
    function addBoxFraction(speciesId, fraction, qtyPerBox) {
        var _a, _b;
        var current = (_b = (_a = activeGroup.items[speciesId]) === null || _a === void 0 ? void 0 : _a.boxes) !== null && _b !== void 0 ? _b : 0;
        setBoxes(speciesId, current + fraction, qtyPerBox);
    }
    function addGroup() {
        var id = Date.now();
        var name = "Order ".concat(String.fromCharCode(65 + groups.length));
        setGroups(function (prev) { return __spreadArray(__spreadArray([], prev, true), [{ id: id, name: name, items: {} }], false); });
        setActiveGroupId(id);
    }
    function removeGroup(id) {
        if (groups.length <= 1)
            return;
        setGroups(function (prev) { return prev.filter(function (g) { return g.id !== id; }); });
        if (activeGroupId === id) {
            setActiveGroupId(groups.find(function (g) { return g.id !== id; }).id);
        }
    }
    var totalPieces = groups.reduce(function (sum, g) { return sum + Object.values(g.items).reduce(function (s, i) { return s + i.pieces; }, 0); }, 0);
    var totalBoxes = groups.reduce(function (sum, g) { return sum + Object.values(g.items).reduce(function (s, i) { return s + i.boxes; }, 0); }, 0);
    function handleSubmit(e) {
        return __awaiter(this, void 0, void 0, function () {
            var digits, formData, orderGroups, body, res, data, _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        e.preventDefault();
                        if (totalPieces === 0)
                            return [2 /*return*/];
                        // Validate phone length
                        if (phoneNumber) {
                            digits = phoneNumber.replace(/\D/g, "");
                            if (digits.length < selectedCountry.minDigits) {
                                sonner_1.toast.error("Phone number must be at least ".concat(selectedCountry.minDigits, " digits for ").concat(selectedCountry.name));
                                return [2 /*return*/];
                            }
                        }
                        setSubmitting(true);
                        formData = new FormData(e.currentTarget);
                        orderGroups = groups
                            .filter(function (g) { return Object.keys(g.items).length > 0; })
                            .map(function (g) { return ({
                            name: g.name,
                            items: Object.entries(g.items).map(function (_a) {
                                var _b, _c, _d, _e, _f, _g, _h, _j;
                                var speciesId = _a[0], pieces = _a[1].pieces;
                                var priceItem = priceList.items.find(function (pi) { return pi.species_id === speciesId; });
                                return {
                                    species_id: speciesId,
                                    species_name: (_c = (_b = priceItem === null || priceItem === void 0 ? void 0 : priceItem.species) === null || _b === void 0 ? void 0 : _b.common_name) !== null && _c !== void 0 ? _c : "",
                                    scientific_name: (_e = (_d = priceItem === null || priceItem === void 0 ? void 0 : priceItem.species) === null || _d === void 0 ? void 0 : _d.scientific_name) !== null && _e !== void 0 ? _e : "",
                                    size: (_h = (_g = (_f = priceItem === null || priceItem === void 0 ? void 0 : priceItem.species) === null || _f === void 0 ? void 0 : _f.sizes) === null || _g === void 0 ? void 0 : _g.join(", ")) !== null && _h !== void 0 ? _h : "",
                                    quantity: pieces,
                                    unit_price: (_j = priceItem === null || priceItem === void 0 ? void 0 : priceItem.custom_price) !== null && _j !== void 0 ? _j : null,
                                };
                            }),
                        }); });
                        body = {
                            customer_name: formData.get("customer_name"),
                            company_name: formData.get("company_name"),
                            email: formData.get("email"),
                            phone: phoneNumber ? "".concat(selectedCountry.dialCode, " ").concat(phoneNumber) : "",
                            country: (_b = selectedCountry === null || selectedCountry === void 0 ? void 0 : selectedCountry.name) !== null && _b !== void 0 ? _b : "",
                            delivery_address: formData.get("delivery_address"),
                            proposed_shipment_date: formData.get("proposed_shipment_date"),
                            consignee_name: formData.get("consignee_name"),
                            consignee_phone: formData.get("consignee_phone"),
                            consignee_address: formData.get("consignee_address"),
                            notes: formData.get("notes"),
                            price_list_id: priceList.id,
                            client_id: priceList.client_id,
                            groups: orderGroups,
                        };
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, fetch("/api/orders", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(body),
                            })];
                    case 2:
                        res = _c.sent();
                        if (!res.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, res.json()];
                    case 3:
                        data = _c.sent();
                        setOrderRef(data.order_reference);
                        setSubmitted(true);
                        sonner_1.toast.success("Order submitted!", {
                            description: "Reference: ".concat(data.order_reference),
                        });
                        return [3 /*break*/, 5];
                    case 4:
                        sonner_1.toast.error("Failed to submit order");
                        _c.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        _a = _c.sent();
                        sonner_1.toast.error("Network error");
                        return [3 /*break*/, 7];
                    case 7:
                        setSubmitting(false);
                        return [2 /*return*/];
                }
            });
        });
    }
    if (submitted) {
        return (<div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <card_1.Card className="max-w-md w-full rounded-2xl">
          <card_1.CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <lucide_react_1.ShoppingCart className="size-7 text-emerald-700"/>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Thanks for trusting us</h2>
            <p className="text-slate-600 mt-2">
              Reference: <strong className="font-mono">{orderRef}</strong>
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Thanks for trusting us; we're currently verifying your order and
              prepping for a safe journey to ensure your new arrivals reach you
              in peak condition.
            </p>
            <p className="text-xs text-slate-500 mt-3">
              By submitting this form, an Excel invoice will be automatically
              generated and shared with the INA team for procurement. You will
              also receive the invoice by email for your records.
            </p>
          </card_1.CardContent>
        </card_1.Card>
      </div>);
    }
    return (<div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-sky-800 truncate">
              iNA Ornamental Fish
            </h1>
            <p className="text-xs text-slate-500 truncate">{priceList.title}</p>
          </div>
          <badge_1.Badge variant="outline" className="text-emerald-700 whitespace-nowrap">
            <lucide_react_1.Package className="size-3 mr-1"/> {totalBoxes.toFixed(2)} Boxes
          </badge_1.Badge>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 sticky top-[65px] z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center gap-2 overflow-x-auto py-2">
          {groups.map(function (g) {
            var groupPieces = Object.values(g.items).reduce(function (s, i) { return s + i.pieces; }, 0);
            return (<button key={g.id} type="button" onClick={function () { return setActiveGroupId(g.id); }} className={"px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ".concat(g.id === activeGroupId
                    ? "bg-sky-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
                {g.name}
                {groupPieces > 0 && (<span className="ml-1.5 text-xs opacity-75">({groupPieces} pcs)</span>)}
              </button>);
        })}
          <button type="button" onClick={addGroup} className="px-3 py-2 rounded-full text-sm font-medium text-sky-700 hover:bg-sky-50">
            + New Group
          </button>
          {groups.length > 1 && (<button type="button" onClick={function () { return removeGroup(activeGroupId); }} className="px-3 py-2 rounded-full text-sm text-red-500 hover:bg-red-50">
              Remove
            </button>)}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs text-slate-600">Availability</label>
              <select value={availabilityFilter} onChange={function (e) { return setAvailabilityFilter(e.target.value); }} className="rounded-xl border border-slate-200 h-9 px-2 text-sm">
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="limited_stock">Scarce</option>
                <option value="seasonal">Out of Season</option>
                <option value="out_of_stock">Unavailable</option>
                <option value="on_request">On Request</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs text-slate-600">Class</label>
              <select value={classFilter} onChange={function (e) { return setClassFilter(e.target.value); }} className="rounded-xl border border-slate-200 h-9 px-2 text-sm">
                <option value="all">All</option>
                {classOptions.map(function (c) { return (<option key={c} value={c}>
                    {c}
                  </option>); })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {filteredItems.map(function (item) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            var sp = item.species;
            if (!sp)
                return null;
            var qtyPerBox = sp.qty_per_box || 1;
            var pieces = (_b = (_a = activeGroup.items[item.species_id]) === null || _a === void 0 ? void 0 : _a.pieces) !== null && _b !== void 0 ? _b : 0;
            var boxes = (_d = (_c = activeGroup.items[item.species_id]) === null || _c === void 0 ? void 0 : _c.boxes) !== null && _d !== void 0 ? _d : 0;
            var mainImg = (_g = (_f = (_e = sp.images) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.image_url) !== null && _g !== void 0 ? _g : "/images/fish-placeholder.svg";
            var avail = (_h = AVAILABILITY_CONFIG[sp.availability]) !== null && _h !== void 0 ? _h : AVAILABILITY_CONFIG.on_request;
            return (<card_1.Card key={item.id} className="rounded-xl overflow-hidden">
                    <div className="relative h-32 sm:h-40 bg-slate-100 overflow-hidden">
                      <img src={mainImg} alt={sp.common_name} className="w-full h-full object-cover"/>
                      {/* Availability badge */}
                      <span className={"absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ".concat(avail.color)}>
                        {avail.label}
                      </span>
                    </div>
                    <card_1.CardContent className="p-3 sm:p-4 space-y-2">
                      {/* Name & price */}
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                          {sp.common_name}
                        </h3>
                        <p className="text-xs italic text-slate-500">
                          {sp.scientific_name}
                        </p>
                        <p className="text-lg font-black text-sky-800 mt-1">
                          ${Number(item.custom_price).toFixed(2)}
                        </p>
                      </div>

                      {/* Size & Box info */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 uppercase tracking-wide font-medium">
                        {((_j = sp.sizes) === null || _j === void 0 ? void 0 : _j.length) > 0 && (<span>SIZE: {sp.sizes.join(", ")}</span>)}
                        <span className="text-sky-700 font-bold">
                          BOX: {qtyPerBox}PCS
                        </span>
                      </div>

                      {/* Quick box buttons */}
                      <div className="flex gap-1.5">
                        {[0.25, 0.5, 1].map(function (frac) { return (<button key={frac} onClick={function () {
                        return addBoxFraction(item.species_id, frac, qtyPerBox);
                    }} className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors border border-sky-200">
                            {frac} BX
                          </button>); })}
                      </div>

                      {/* Pieces & Boxes counters */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Pieces */}
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Pieces
                          </p>
                          <div className="flex items-center gap-1">
                            <button onClick={function () {
                    return setPieces(item.species_id, pieces - 1, qtyPerBox);
                }} disabled={pieces === 0} className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30">
                              <lucide_react_1.Minus className="size-3"/>
                            </button>
                            <input_1.Input type="number" min={0} value={pieces} onChange={function (e) {
                    return setPieces(item.species_id, parseInt(e.target.value) || 0, qtyPerBox);
                }} className="h-7 text-center text-sm font-semibold rounded-md px-1 flex-1 min-w-0"/>
                            <button onClick={function () {
                    return setPieces(item.species_id, pieces + 1, qtyPerBox);
                }} className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">
                              <lucide_react_1.Plus className="size-3"/>
                            </button>
                          </div>
                        </div>

                        {/* Boxes */}
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Boxes
                          </p>
                          <div className="flex items-center gap-1">
                            <button onClick={function () {
                    return setBoxes(item.species_id, Math.max(0, boxes - 0.25), qtyPerBox);
                }} disabled={boxes === 0} className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30">
                              <lucide_react_1.Minus className="size-3"/>
                            </button>
                            <input_1.Input type="number" min={0} step={0.25} value={boxes.toFixed(2)} onChange={function (e) {
                    return setBoxes(item.species_id, parseFloat(e.target.value) || 0, qtyPerBox);
                }} className="h-7 text-center text-sm font-semibold rounded-md px-1 flex-1 min-w-0"/>
                            <button onClick={function () {
                    return setBoxes(item.species_id, boxes + 0.25, qtyPerBox);
                }} className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">
                              <lucide_react_1.Plus className="size-3"/>
                            </button>
                          </div>
                        </div>
                      </div>
                    </card_1.CardContent>
                  </card_1.Card>);
        })}
            </div>
          </div>

          {/* Order Summary & Form */}
          <div>
            <card_1.Card className="rounded-xl sticky top-[120px]">
              <card_1.CardContent className="p-4 sm:p-5">
                <h2 className="font-bold text-slate-900 text-lg mb-2">
                  Order Summary
                </h2>
                <div className="flex gap-4 text-sm mb-4">
                  <span className="text-slate-600">
                    <strong className="text-sky-800">{totalPieces}</strong>{" "}
                    pieces
                  </span>
                  <span className="text-slate-600">
                    <strong className="text-sky-800">
                      {totalBoxes.toFixed(2)}
                    </strong>{" "}
                    boxes
                  </span>
                </div>

                {totalPieces === 0 ? (<p className="text-sm text-slate-500">
                    Select species and quantities to build your order.
                  </p>) : (<>
                    <div className="space-y-1 mb-4 max-h-48 overflow-y-auto border-t border-slate-100 pt-2">
                      {groups.map(function (g) {
                return Object.entries(g.items).map(function (_a) {
                    var _b, _c;
                    var speciesId = _a[0], _d = _a[1], pcs = _d.pieces, bx = _d.boxes;
                    var pi = priceList.items.find(function (i) { return i.species_id === speciesId; });
                    var lineTotal = pcs * Number((_b = pi === null || pi === void 0 ? void 0 : pi.custom_price) !== null && _b !== void 0 ? _b : 0);
                    return (<div key={"".concat(g.id, "-").concat(speciesId)} className="flex justify-between text-xs py-1 border-b border-slate-50 gap-1">
                                <span className="truncate flex-1">
                                  {groups.length > 1 && (<span className="text-slate-400">
                                      [{g.name}]{" "}
                                    </span>)}
                                  {(_c = pi === null || pi === void 0 ? void 0 : pi.species) === null || _c === void 0 ? void 0 : _c.common_name}
                                </span>
                                <span className="font-medium text-slate-600 whitespace-nowrap">
                                  {pcs}pcs / {bx.toFixed(2)}bx
                                </span>
                                <span className="font-bold text-sky-800 whitespace-nowrap ml-1">
                                  ${lineTotal.toFixed(2)}
                                </span>
                              </div>);
                });
            })}
                    </div>

                    {/* Grand total */}
                    <div className="flex justify-between items-center py-2 border-t border-slate-200 mb-4">
                      <span className="font-bold text-slate-900">Total</span>
                      <span className="font-black text-lg text-sky-800">
                        $
                        {groups
                .reduce(function (sum, g) {
                return sum +
                    Object.entries(g.items).reduce(function (s, _a) {
                        var _b;
                        var speciesId = _a[0], pcs = _a[1].pieces;
                        var pi = priceList.items.find(function (i) { return i.species_id === speciesId; });
                        return (s + pcs * Number((_b = pi === null || pi === void 0 ? void 0 : pi.custom_price) !== null && _b !== void 0 ? _b : 0));
                    }, 0);
            }, 0)
                .toFixed(2)}
                      </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                      <input_1.Input required name="customer_name" placeholder="Full Name" defaultValue={(_f = (_e = priceList.client) === null || _e === void 0 ? void 0 : _e.name) !== null && _f !== void 0 ? _f : ""} className="rounded-xl h-10"/>
                      <input_1.Input name="company_name" placeholder="Company Name" defaultValue={(_h = (_g = priceList.client) === null || _g === void 0 ? void 0 : _g.company) !== null && _h !== void 0 ? _h : ""} className="rounded-xl h-10"/>
                      <input_1.Input required name="email" type="email" placeholder="Email Address" defaultValue={(_k = (_j = priceList.client) === null || _j === void 0 ? void 0 : _j.email) !== null && _k !== void 0 ? _k : ""} className="rounded-xl h-10"/>
                      {/* Phone with country code */}
                      <div className="relative" ref={phoneCodeRef}>
                        <div className="flex h-10 rounded-xl border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                          <button type="button" onClick={function () { return setPhoneCodeOpen(!phoneCodeOpen); }} className="flex items-center gap-1 px-2.5 bg-slate-50 border-r border-input text-sm font-medium text-slate-700 hover:bg-slate-100 shrink-0">
                            {selectedCountry.dialCode}
                            <lucide_react_1.ChevronDown className="size-3 text-slate-400"/>
                          </button>
                          <input type="tel" name="phone" placeholder={"Phone (".concat(selectedCountry.minDigits, "-").concat(selectedCountry.maxDigits, " digits)")} value={phoneNumber} maxLength={selectedCountry.maxDigits} onChange={function (e) {
                var digits = e.target.value.replace(/\D/g, "");
                if (digits.length <= selectedCountry.maxDigits) {
                    setPhoneNumber(digits);
                }
            }} className="flex-1 px-3 text-sm bg-transparent outline-none placeholder:text-muted-foreground"/>
                        </div>
                        {phoneCodeOpen && (<div className="absolute top-full left-0 mt-1 w-64 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                            <div className="sticky top-0 bg-white p-2 border-b border-slate-100">
                              <div className="flex items-center gap-2 px-2 h-8 rounded-lg bg-slate-50 border border-slate-200">
                                <lucide_react_1.Search className="size-3.5 text-slate-400"/>
                                <input type="text" placeholder="Search country..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" onChange={function (e) {
                    return setCountrySearch(e.target.value);
                }} autoFocus/>
                              </div>
                            </div>
                            {countries_1.COUNTRIES.filter(function (c) {
                    return c.name
                        .toLowerCase()
                        .includes(countrySearch.toLowerCase()) ||
                        c.dialCode.includes(countrySearch);
                }).map(function (c) { return (<button key={c.code + c.dialCode} type="button" onClick={function () {
                        setSelectedCountry(c);
                        setPhoneCodeOpen(false);
                        setCountrySearch("");
                    }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between">
                                <span>{c.name}</span>
                                <span className="text-slate-400 text-xs font-mono">
                                  {c.dialCode}
                                </span>
                              </button>); })}
                          </div>)}
                      </div>

                      {/* Country searchable dropdown */}
                      <div className="relative" ref={countryRef}>
                        <button type="button" onClick={function () {
                return setCountryDropdownOpen(!countryDropdownOpen);
            }} className="flex items-center justify-between w-full h-10 px-3 rounded-xl border border-input bg-transparent text-sm hover:bg-slate-50">
                          <span className={selectedCountry
                ? "text-slate-900"
                : "text-muted-foreground"}>
                            {(_l = selectedCountry === null || selectedCountry === void 0 ? void 0 : selectedCountry.name) !== null && _l !== void 0 ? _l : "Select Country"}
                          </span>
                          <lucide_react_1.ChevronDown className="size-4 text-slate-400"/>
                        </button>
                        {countryDropdownOpen && (<div className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                            <div className="sticky top-0 bg-white p-2 border-b border-slate-100">
                              <div className="flex items-center gap-2 px-2 h-8 rounded-lg bg-slate-50 border border-slate-200">
                                <lucide_react_1.Search className="size-3.5 text-slate-400"/>
                                <input type="text" placeholder="Search country..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" onChange={function (e) {
                    return setCountrySearch(e.target.value);
                }} autoFocus/>
                              </div>
                            </div>
                            {countries_1.COUNTRIES.filter(function (c) {
                    return c.name
                        .toLowerCase()
                        .includes(countrySearch.toLowerCase());
                }).map(function (c) { return (<button key={c.code} type="button" onClick={function () {
                        setSelectedCountry(c);
                        setCountryDropdownOpen(false);
                        setCountrySearch("");
                    }} className={"w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ".concat(c.code === (selectedCountry === null || selectedCountry === void 0 ? void 0 : selectedCountry.code)
                        ? "bg-sky-50 text-sky-800 font-medium"
                        : "")}>
                                {c.name}
                              </button>); })}
                          </div>)}
                      </div>
                      <input_1.Input name="delivery_address" placeholder="Delivery Address" className="rounded-xl h-10"/>
                      <textarea_1.Textarea name="notes" placeholder="Additional notes..." rows={3} className="rounded-xl"/>
                      <button_1.Button type="submit" disabled={submitting} className="w-full h-11 rounded-xl font-semibold">
                        {submitting ? "Submitting..." : "Submit Order"}
                      </button_1.Button>
                    </form>
                  </>)}

                <a href={"https://wa.me/".concat(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2348168850307")} target="_blank" rel="noopener noreferrer" className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-11 text-sm font-semibold transition-colors">
                  <lucide_react_1.MessageCircle className="size-4"/>
                  Contact via WhatsApp
                </a>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </div>
      </div>);
    div >
    ;
    ;
}
