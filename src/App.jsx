import { useState, useMemo, useRef, useEffect } from "react";

const OUTPUT_TYPE_MAP = {
  "Text": "text", "Numeric": "numeric", "Numeric / Currency": "numeric",
  "Currency": "numeric", "Date": "date", "True/False": "text",
  "Varies": "all", "Single Instance": "all", "Multi-Instance": "all",
};

const FIELDS_ALL_BASE = {
  "Financial Accounting / GL": ["Ledger Account","Ledger Account Type","Account Set","Chart of Accounts","Journal Entry","Journal Line","Debit Amount","Credit Amount","Net Amount","Accounting Date","Period","Fiscal Year","Fiscal Period","Book Code","Currency","Currency Rate","Intercompany","Elimination","Consolidation","Ledger Type","Company","Cost Center","Business Unit","Region","Fund","Grant","Program","Project","Custom Worktag 1","Custom Worktag 2"],
  "Procurement & Spend": ["Purchase Order","PO Number","PO Line","PO Line Amount","PO Status","Supplier","Supplier Contract","Spend Category","Requisition","Requisition Line","Requisition Amount","Requisition Status","Buyer","Deliver-To Location","Ship-To Address","Commodity Code","Unit of Measure","Quantity Ordered","Unit Cost","Extended Amount","Receipt","Receipt Line","Receipt Date","Matched Status"],
  "Accounts Payable": ["Supplier Invoice","Invoice Number","Invoice Date","Invoice Due Date","Invoice Status","Invoice Line","Invoice Line Amount","Invoice Line Description","Supplier","Payment Terms","Payment Status","Payment Date","Payment Amount","Payment Method","Check Number","Aging Bucket","Days Past Due","Discount Date","Discount Amount","Tax Amount","Withholding Amount","Memo","AP Aging"],
  "Projects & Expenses": ["Project","Project ID","Project Status","Project Phase","Project Task","Project Role","Project Budget","Project Actual","Project Variance","Project Start Date","Project End Date","Billable","Billing Status","Expense Report","Expense Report Status","Expense Line","Expense Line Amount","Expense Item","Expense Item Type","Merchant","Business Purpose","Receipt Required","Reimbursable Amount","Cost Type","Revenue Amount","Revenue Recognition Method"],
  "Assets": ["Asset","Asset ID","Asset Class","Asset Category","Asset Status","Asset Description","Acquisition Date","Acquisition Cost","Net Book Value","Accumulated Depreciation","Depreciation Method","Useful Life (Years)","Useful Life (Periods)","Salvage Value","Depreciation Start Date","Last Depreciation Date","Retirement Date","Retirement Amount","Asset Location","Custodian","Book","Asset Tag","Serial Number","Manufacturer","Replacement Cost"],
  "Banking & Cash": ["Bank Account","Bank Account Number","Bank Name","Bank Branch","Routing Number","Currency","Cash Position","Settlement","Settlement Date","Settlement Amount","Settlement Status","Ad Hoc Payment","Petty Cash","Bank Statement","Bank Transaction","Reconciliation Status","Cleared Date","Cleared Amount","Outstanding Balance","Cash Flow Category","Interbank Transfer"],
  "Budget": ["Budget","Budget Period","Budget Period Start Date","Budget Period End Date","Budget Status","Budget Amount","Encumbrance Amount","Actuals Amount","Budget Variance","Budget Remaining","Budget Check Result","Budget Pool","Budget Structure","Budget Rule","Original Budget Amount","Revised Budget Amount","Year-to-Date Budget","Year-to-Date Actuals","Budget Organization"],
  "Worker (Bridge)": ["Employee ID","Worker Name","Legal First Name","Legal Last Name","Manager","Cost Center","Company","Business Unit","Location","Job Profile","Department"],
  "Calculated / Constants": ["Numeric Constant","Text Constant","Date Constant","CF (Calculated Field Reference)","True","False"]
};
const NUMERIC_BASE = { "Financial Accounting / GL": ["Debit Amount","Credit Amount","Net Amount","Currency Rate"], "Procurement & Spend": ["PO Line Amount","Requisition Amount","Quantity Ordered","Unit Cost","Extended Amount"], "Accounts Payable": ["Invoice Line Amount","Payment Amount","Discount Amount","Tax Amount","Withholding Amount","Days Past Due","AP Aging"], "Projects & Expenses": ["Project Budget","Project Actual","Project Variance","Expense Line Amount","Reimbursable Amount","Revenue Amount"], "Assets": ["Acquisition Cost","Net Book Value","Accumulated Depreciation","Salvage Value","Useful Life (Years)","Useful Life (Periods)","Retirement Amount","Replacement Cost"], "Banking & Cash": ["Cash Position","Settlement Amount","Cleared Amount","Outstanding Balance"], "Budget": ["Budget Amount","Encumbrance Amount","Actuals Amount","Budget Variance","Budget Remaining","Original Budget Amount","Revised Budget Amount","Year-to-Date Budget","Year-to-Date Actuals"], "Calculated / Constants": ["Numeric Constant","CF (Calculated Field Reference)"] };
const DATE_BASE = { "Financial Accounting / GL": ["Accounting Date","Fiscal Year","Fiscal Period"], "Procurement & Spend": ["Receipt Date"], "Accounts Payable": ["Invoice Date","Invoice Due Date","Payment Date","Discount Date"], "Projects & Expenses": ["Project Start Date","Project End Date"], "Assets": ["Acquisition Date","Depreciation Start Date","Last Depreciation Date","Retirement Date"], "Banking & Cash": ["Settlement Date","Cleared Date"], "Budget": ["Budget Period Start Date","Budget Period End Date"], "Calculated / Constants": ["Today","Date Constant","CF (Calculated Field Reference)"] };
const TEXT_BASE = { "Financial Accounting / GL": ["Ledger Account","Ledger Account Type","Account Set","Chart of Accounts","Book Code","Currency","Ledger Type","Company","Cost Center","Business Unit","Region","Fund","Grant","Program","Intercompany","Custom Worktag 1","Custom Worktag 2"], "Procurement & Spend": ["PO Number","PO Status","Supplier","Supplier Contract","Spend Category","Requisition","Commodity Code","Unit of Measure","Matched Status","Deliver-To Location","Ship-To Address"], "Accounts Payable": ["Invoice Number","Invoice Status","Supplier","Payment Terms","Payment Status","Payment Method","Check Number","Aging Bucket","Memo"], "Projects & Expenses": ["Project","Project ID","Project Status","Project Phase","Project Task","Project Role","Expense Report Status","Expense Item","Expense Item Type","Merchant","Business Purpose","Billable","Billing Status","Cost Type","Revenue Recognition Method"], "Assets": ["Asset","Asset ID","Asset Class","Asset Category","Asset Status","Asset Description","Depreciation Method","Asset Location","Custodian","Book","Asset Tag","Serial Number","Manufacturer"], "Banking & Cash": ["Bank Account","Bank Account Number","Bank Name","Bank Branch","Routing Number","Currency","Settlement Status","Reconciliation Status","Cash Flow Category"], "Budget": ["Budget","Budget Status","Budget Check Result","Budget Pool","Budget Structure","Budget Rule","Budget Organization"], "Worker (Bridge)": ["Employee ID","Worker Name","Legal First Name","Legal Last Name","Job Profile","Department","Location"], "Calculated / Constants": ["Text Constant","CF (Calculated Field Reference)"] };

function buildFieldMap(base, savedFields, typeFilter) {
  const merged = {};
  Object.entries(base).forEach(([cat, fields]) => { merged[cat] = [...fields]; });
  const matching = savedFields.filter(sf => {
    if (!typeFilter || typeFilter === "all") return true;
    const t = OUTPUT_TYPE_MAP[sf.outputType] || "all";
    return t === typeFilter || t === "all";
  });
  if (matching.length > 0) merged["My Saved Calc Fields"] = matching.map(sf => `CF: ${sf.name}`);
  return merged;
}

const DATE_MASKS = [{ label:"MM/DD/YYYY",example:"03/20/2026"},{ label:"YYYY-MM-DD",example:"2026-03-20"},{ label:"DD/MM/YYYY",example:"20/03/2026"},{ label:"MMMM",example:"March"},{ label:"MMM",example:"Mar"},{ label:"MM",example:"03"},{ label:"YYYY",example:"2026"},{ label:"YY",example:"26"},{ label:"DD",example:"20"},{ label:"EEEE",example:"Friday"},{ label:"EEE",example:"Fri"},{ label:"QQ",example:"Q1"},{ label:"MM/YYYY",example:"03/2026"},{ label:"MMMM YYYY",example:"March 2026"},{ label:"MM/DD/YYYY HH:mm:ss",example:"03/20/2026 14:30:00"}];
const NUMBER_MASKS = [{ label:"#,##0",example:"75,000"},{ label:"#,##0.00",example:"75,000.00"},{ label:"#,##0.0",example:"75,000.0"},{ label:"0.00%",example:"75.00%"},{ label:"0%",example:"75%"},{ label:"$#,##0.00",example:"$75,000.00"},{ label:"#,##0.00;(#,##0.00)",example:"Negative in parens"},{ label:"0",example:"75000"},{ label:"#.##",example:"75000.5"}];
const TEXT_MASKS = [{ label:"UPPER",example:"JOHN"},{ label:"LOWER",example:"john"},{ label:"PROPER",example:"John Smith"},{ label:"TRIM",example:"john (trimmed)"}];
const OPERATORS = ["=","≠",">","<","≥","≤","Is Empty","Is Not Empty","Contains","Does Not Contain","Starts With","In Set","Not In Set"];

function FieldSearch({ value, onChange, placeholder, fieldMap }) {
  const allFields = useMemo(() => Object.entries(fieldMap).flatMap(([cat,f]) => f.map(x => ({ label:x, category:cat }))), [fieldMap]);
  const [query, setQuery] = useState(value||"");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h=(e)=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown",h); return ()=>document.removeEventListener("mousedown",h); },[]);
  const results = useMemo(() => { if(!query) return allFields.slice(0,40); const q=query.toLowerCase(); return allFields.filter(f=>f.label.toLowerCase().includes(q)||f.category.toLowerCase().includes(q)).slice(0,40); },[query,allFields]);
  const grouped = useMemo(() => { const g={}; results.forEach(f=>{ if(!g[f.category]) g[f.category]=[]; g[f.category].push(f.label); }); return g; },[results]);
  const select=(val)=>{ setQuery(val); onChange(val); setOpen(false); };
  return (
    <div ref={ref} style={{position:"relative"}}>
      <input value={query} onChange={e=>{ setQuery(e.target.value); onChange(e.target.value); setOpen(true); }} onFocus={()=>setOpen(true)} placeholder={placeholder||"Type to search…"} style={{width:"100%",padding:"8px 10px",borderRadius:6,border:"1px solid #cbd5e1",fontSize:13,boxSizing:"border-box"}}/>
      {open&&<div style={{position:"absolute",zIndex:999,background:"white",border:"1px solid #cbd5e1",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",maxHeight:240,overflowY:"auto",width:"100%",top:"calc(100% + 4px)"}}>
        {Object.entries(grouped).map(([cat,fields])=>(
          <div key={cat}>
            <div style={{fontSize:10,fontWeight:700,color:cat==="My Saved Calc Fields"?"#0369a1":"#94a3b8",textTransform:"uppercase",letterSpacing:1,padding:"6px 12px 2px",background:cat==="My Saved Calc Fields"?"#e0f2fe":"#f8fafc",position:"sticky",top:0}}>{cat}</div>
            {fields.map(f=><div key={f} onMouseDown={()=>select(f)} style={{padding:"7px 14px",fontSize:13,cursor:"pointer",color:f.startsWith("CF:")?"#0369a1":"#1e293b",fontWeight:f.startsWith("CF:")?600:400}} onMouseEnter={e=>e.currentTarget.style.background="#eff6ff"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{f}</div>)}
          </div>
        ))}
        {Object.keys(grouped).length===0&&<div style={{padding:12,fontSize:13,color:"#94a3b8"}}>No matching fields — type a custom name</div>}
      </div>}
    </div>
  );
}

function MaskPicker({ masks, value, onChange, placeholder }) {
  const [open,setOpen]=useState(false); const ref=useRef(null);
  useEffect(()=>{ const h=(e)=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown",h); return ()=>document.removeEventListener("mousedown",h); },[]);
  return (
    <div ref={ref} style={{position:"relative"}}>
      <div style={{display:"flex",gap:6}}>
        <input value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{flex:1,padding:"8px 10px",borderRadius:6,border:"1px solid #cbd5e1",fontSize:13}}/>
        <button onMouseDown={()=>setOpen(o=>!o)} style={{padding:"0 10px",borderRadius:6,border:"1px solid #cbd5e1",background:"#f1f5f9",cursor:"pointer",fontSize:12,color:"#475569",whiteSpace:"nowrap"}}>Pick ▾</button>
      </div>
      {open&&<div style={{position:"absolute",zIndex:999,background:"white",border:"1px solid #cbd5e1",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",width:"100%",top:"calc(100% + 4px)",maxHeight:220,overflowY:"auto"}}>
        {masks.map(m=><div key={m.label} onMouseDown={()=>{ onChange(m.label); setOpen(false); }} style={{padding:"8px 14px",cursor:"pointer",borderBottom:"1px solid #f1f5f9"}} onMouseEnter={e=>e.currentTarget.style.background="#eff6ff"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <span style={{fontFamily:"monospace",fontSize:13,fontWeight:600,color:"#1e3a5f"}}>{m.label}</span>
          <span style={{fontSize:12,color:"#64748b",marginLeft:10}}>→ {m.example}</span>
        </div>)}
      </div>}
    </div>
  );
}

function OperatorPicker({ value, onChange }) {
  return <select value={value||""} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"8px 10px",borderRadius:6,border:"1px solid #cbd5e1",fontSize:13}}><option value="">Select operator…</option>{OPERATORS.map(o=><option key={o} value={o}>{o}</option>)}</select>;
}

function buildFunctions(savedFields) {
  const all=()=>buildFieldMap(FIELDS_ALL_BASE,savedFields,"all");
  const num=()=>buildFieldMap(NUMERIC_BASE,savedFields,"numeric");
  const dat=()=>buildFieldMap(DATE_BASE,savedFields,"date");
  const datDay=()=>{ const b=buildFieldMap(DATE_BASE,savedFields,"date"); b["Day Constants"]=["1 (First of Month)","15 (Mid-Month)","28","29","30","31"]; return b; };
  const txt=()=>buildFieldMap(TEXT_BASE,savedFields,"text");
  return {
    "Text":[
      {name:"Concatenate Text",abbr:"CT",output:"Text",desc:"Combines multiple text fields and/or constants into a single string.",example:'Supplier + " - " + Invoice Number → "Acme Corp - INV-00123"',fields:[{id:"part1",label:"Part 1 (Field or Text)",type:"field",fieldMap:txt()},{id:"sep1",label:"Separator / Constant 1 (optional)",type:"text",placeholder:'e.g. " - "'},{id:"part2",label:"Part 2 (Field or Text)",type:"field",fieldMap:txt()},{id:"sep2",label:"Separator / Constant 2 (optional)",type:"text",placeholder:'e.g. " (" or leave blank'},{id:"part3",label:"Part 3 (optional)",type:"field",fieldMap:txt()}]},
      {name:"Substring Text",abbr:"SUB",output:"Text",desc:"Extracts a portion of a text field by specifying a start position and length.",example:"Invoice Number, Start: 1, Length: 3 → prefix characters",fields:[{id:"source",label:"Source Field",type:"field",fieldMap:txt()},{id:"start",label:"Start Position",type:"text",placeholder:"e.g. 1"},{id:"length",label:"Length (# of characters)",type:"text",placeholder:"e.g. 3"}]},
      {name:"Format Text",abbr:"FT",output:"Text",desc:"Formats a text value using a mask (UPPER, LOWER, PROPER, TRIM).",example:'Supplier Name, PROPER → "Acme Corporation"',fields:[{id:"source",label:"Source Field",type:"field",fieldMap:txt()},{id:"mask",label:"Format Mask",type:"textmask"}]},
      {name:"Text Constant",abbr:"TC",output:"Text",desc:"Returns a fixed text value on every row.",example:'"APPROVED" displayed on every row',fields:[{id:"value",label:"Constant Value",type:"text",placeholder:"e.g. APPROVED"}]},
      {name:"Text Length",abbr:"TL",output:"Numeric",desc:"Returns the number of characters in a text field.",example:"Invoice Number → character count",fields:[{id:"source",label:"Source Field",type:"field",fieldMap:txt()}]},
      {name:"Convert Text to Number",abbr:"CTN",output:"Numeric",desc:"Converts a text field containing a numeric value into a number for arithmetic use.",example:'"5000" (text) → 5000 (number)',fields:[{id:"source",label:"Source Text Field",type:"field",fieldMap:txt()}]},
      {name:"Lookup Translated Value",abbr:"LTV",output:"Text",desc:"Returns the translated display text of an instance field based on the user's language.",example:'Invoice Status instance → "Approved" or "Pending"',fields:[{id:"source",label:"Source Instance Field",type:"field",fieldMap:all()}]}
    ],
    "Numeric":[
      {name:"Arithmetic Calculation",abbr:"ARI",output:"Numeric / Currency",desc:"Performs math operations on numeric or currency fields. All fields must share the same currency code.",example:"Budget Amount − Actuals Amount → Budget Remaining",fields:[{id:"operand1",label:"First Value / Field",type:"field",fieldMap:num()},{id:"operator",label:"Operator",type:"select",options:["+","-","×","÷"]},{id:"operand2",label:"Second Value / Field",type:"field",fieldMap:num()}]},
      {name:"Numeric Constant",abbr:"NUM",output:"Numeric",desc:"Returns a fixed numeric value on every row.",example:"100 used as a multiplier",fields:[{id:"value",label:"Numeric Value",type:"text",placeholder:"e.g. 100"}]},
      {name:"Format Number",abbr:"FN",output:"Text",desc:"Formats a numeric or currency value using a display mask.",example:'1500000 → "$1,500,000.00"',fields:[{id:"source",label:"Source Numeric Field",type:"field",fieldMap:num()},{id:"mask",label:"Format Mask",type:"numbermask"}]},
      {name:"Convert Currency",abbr:"CC",output:"Currency",desc:"Converts a currency amount to a target currency using Workday exchange rates.",example:"Invoice Line Amount (EUR) → USD equivalent",fields:[{id:"source",label:"Source Currency Field",type:"field",fieldMap:num()},{id:"target",label:"Target Currency",type:"text",placeholder:"e.g. USD"}]},
      {name:"Lookup Range Band",abbr:"LRB",output:"Text",desc:"Categorizes a numeric or currency field into a labeled range band.",example:'Invoice Amount → "Small", "Medium", or "Large"',fields:[{id:"source",label:"Source Numeric / Currency Field",type:"field",fieldMap:num()},{id:"bands",label:"Bands (Range → Label, one per line)",type:"textarea",placeholder:"0 – 10000 → Small\n10001 – 100000 → Medium\n100001+ → Large"}]}
    ],
    "Date":[
      {name:"Build Date",abbr:"BD",output:"Date",desc:"Constructs a new date by combining year, month, and day components from separate fields or constants.",example:"Accounting Date year + month + 1 → first day of period",fields:[{id:"year",label:"Year Source",type:"field",fieldMap:dat()},{id:"month",label:"Month Source",type:"field",fieldMap:dat()},{id:"day",label:"Day (field or constant)",type:"field",fieldMap:datDay()}]},
      {name:"Date Constant",abbr:"DC",output:"Date",desc:"Returns a fixed date value on every row.",example:"01/01/2026 returned on every row as fiscal year start",fields:[{id:"value",label:"Constant Date",type:"text",placeholder:"e.g. 01/01/2026"},{id:"type",label:"Date Type",type:"select",options:["Date","Date and Time","Date with Time Zone"]}]},
      {name:"Date Difference",abbr:"DD",output:"Numeric",desc:"Calculates the difference between two dates, returning a numeric result.",example:"Invoice Due Date − Today → days until due",fields:[{id:"start",label:"Start Date Field",type:"field",fieldMap:dat()},{id:"end",label:"End Date Field",type:"field",fieldMap:dat()},{id:"unit",label:"Unit",type:"select",options:["Days","Months","Years"]}]},
      {name:"Format Date",abbr:"FD",output:"Text",desc:"Formats a date field using a display mask.",example:'Accounting Date → "March 2026"',fields:[{id:"source",label:"Source Date Field",type:"field",fieldMap:dat()},{id:"mask",label:"Format Mask",type:"datemask"}]},
      {name:"Increment or Decrement Date",abbr:"IDD",output:"Date",desc:"Adds or subtracts a specified number of days, months, or years from a date field.",example:"Invoice Date + 30 Days → estimated due date",fields:[{id:"source",label:"Source Date Field",type:"field",fieldMap:dat()},{id:"direction",label:"Direction",type:"select",options:["Increment (Add)","Decrement (Subtract)"]},{id:"amount",label:"Amount",type:"text",placeholder:"e.g. 30"},{id:"unit",label:"Unit",type:"select",options:["Days","Months","Years"]}]},
      {name:"Lookup Value as of Date",abbr:"LVAOD",output:"Varies",desc:"Returns the value of a field as it existed on a specific historical date.",example:"Budget Amount as of 06/30/2025 → mid-year snapshot",fields:[{id:"source",label:"Source Field",type:"field",fieldMap:all()},{id:"date",label:"As of Date (Field or Constant)",type:"field",fieldMap:dat()}]}
    ],
    "Logical":[
      {name:"True/False Condition",abbr:"TF",output:"True/False",desc:"Evaluates a condition and returns a Boolean result.",example:'Invoice Status = "Approved" → True/False',fields:[{id:"field",label:"Field to Evaluate",type:"field",fieldMap:all()},{id:"operator",label:"Operator",type:"operator"},{id:"value",label:"Comparison Value",type:"field",fieldMap:all()}]},
      {name:"Evaluate Expression",abbr:"EE",output:"Varies",desc:"Evaluates IF/THEN/ELSE conditions and returns the value for the first matching condition.",example:'Days Past Due ≥ 90 → "90+" | ≥ 60 → "60-89" | else → "Current"',fields:[{id:"cond1field",label:"Condition 1 — Field",type:"field",fieldMap:all()},{id:"cond1op",label:"Condition 1 — Operator",type:"operator"},{id:"cond1val",label:"Condition 1 — Value",type:"field",fieldMap:all()},{id:"cond1return",label:"Condition 1 — Return Value",type:"text",placeholder:'e.g. "90+"'},{id:"cond2field",label:"Condition 2 — Field (optional)",type:"field",fieldMap:all()},{id:"cond2op",label:"Condition 2 — Operator (optional)",type:"operator"},{id:"cond2val",label:"Condition 2 — Value (optional)",type:"field",fieldMap:all()},{id:"cond2return",label:"Condition 2 — Return Value (optional)",type:"text",placeholder:'e.g. "60-89"'},{id:"elsereturn",label:"ELSE — Default Return Value",type:"text",placeholder:'e.g. "Current"'},{id:"returntype",label:"Return Type",type:"select",options:["Text","Numeric","Date","Instance","True/False"]}]},
      {name:"Prompt for Value",abbr:"PFV",output:"Varies",desc:"Prompts the report runner to enter a value at runtime.",example:"User enters an Accounting Date at runtime",fields:[{id:"label",label:"Prompt Label",type:"text",placeholder:"e.g. Enter Accounting Date"},{id:"type",label:"Value Type",type:"select",options:["Text","Numeric","Date","Instance"]}]}
    ],
    "Instance / Lookup":[
      {name:"Lookup Related Value",abbr:"LRV",output:"Varies",desc:"Retrieves a field value from a related single-instance business object.",example:"Purchase Order (via ESI) → Supplier Name",fields:[{id:"source",label:"Source Instance Field (single-instance)",type:"field",fieldMap:all()},{id:"related",label:"Related Field to Return",type:"field",fieldMap:all()}]},
      {name:"Extract Single Instance",abbr:"ESI",output:"Single Instance",desc:"Extracts one specific instance from a multi-instance field based on a condition or sort.",example:"All Invoice Lines where Line Amount is greatest → single line",fields:[{id:"source",label:"Source Multi-Instance Field",type:"field",fieldMap:all()},{id:"condfield",label:"Filter Field (optional)",type:"field",fieldMap:all()},{id:"condop",label:"Filter Operator (optional)",type:"operator"},{id:"condval",label:"Filter Value (optional)",type:"field",fieldMap:all()},{id:"sort",label:"Sort Field (if picking first/last)",type:"field",fieldMap:all()},{id:"sortdir",label:"Sort Direction",type:"select",options:["Ascending","Descending"]}]},
      {name:"Extract Multi-Instance",abbr:"EMI",output:"Multi-Instance",desc:"Performs set operations (Subset, Union, Intersection, Except) on multi-instance fields.",example:"All Invoice Lines filtered to lines over $10,000",fields:[{id:"source",label:"Source Multi-Instance Field",type:"field",fieldMap:all()},{id:"operation",label:"Operation",type:"select",options:["Subset (Filter)","Union","Intersection","Except"]},{id:"condfield",label:"Condition Field",type:"field",fieldMap:all()},{id:"condop",label:"Condition Operator",type:"operator"},{id:"condval",label:"Condition Value",type:"field",fieldMap:all()}]},
      {name:"Lookup Hierarchy",abbr:"LH",output:"Varies",desc:"Retrieves a value by traversing up or down a cost center or organizational hierarchy.",example:"Cost Center's parent region name",fields:[{id:"source",label:"Starting Hierarchy Object",type:"field",fieldMap:all()},{id:"level",label:"Hierarchy Level",type:"text",placeholder:"e.g. 2"},{id:"field",label:"Field to Return",type:"field",fieldMap:all()}]},
      {name:"Lookup Hierarchy Rollup",abbr:"LHR",output:"Numeric",desc:"Aggregates a value across an entire organizational or cost center hierarchy subtree.",example:"Total Budget Amount rolled up across all cost centers under a region",fields:[{id:"source",label:"Hierarchy Object",type:"field",fieldMap:all()},{id:"field",label:"Field to Aggregate",type:"field",fieldMap:num()},{id:"agg",label:"Aggregation Type",type:"select",options:["Sum","Count"]}]},
      {name:"Lookup Organization",abbr:"LO",output:"Instance",desc:"Returns a specific organization associated with a transaction or position.",example:"Invoice's Cost Center organization",fields:[{id:"source",label:"Source Object",type:"field",fieldMap:all()},{id:"orgType",label:"Organization Type",type:"select",options:["Cost Center","Company","Business Unit","Region","Division","Fund","Grant","Program","Custom Organization"]}]},
      {name:"Lookup Organizational Roles",abbr:"LOR",output:"Instance",desc:"Returns the person(s) assigned to a specific organizational role.",example:"Finance Partner assigned to a cost center",fields:[{id:"source",label:"Source Organization",type:"field",fieldMap:all()},{id:"role",label:"Organizational Role",type:"select",options:["Finance Partner","Cost Center Manager","Procurement Buyer","Accounts Payable Specialist","Controller","Budget Owner","Project Manager","Asset Manager","Auditor","Custom Role"]}]}
    ],
    "Aggregation":[
      {name:"Count Related Instances",abbr:"CRI",output:"Numeric",desc:"Counts the number of related instances that meet an optional condition.",example:"Count of open invoices for a supplier",fields:[{id:"source",label:"Source Multi-Instance / Related Field",type:"field",fieldMap:all()},{id:"condfield",label:"Filter Field (optional)",type:"field",fieldMap:all()},{id:"condop",label:"Filter Operator (optional)",type:"operator"},{id:"condval",label:"Filter Value (optional)",type:"field",fieldMap:all()}]},
      {name:"Aggregate Related Instances",abbr:"AGG",output:"Multi-Instance",desc:"Returns a set of related instances associated with a business object.",example:"All invoice lines associated with a purchase order",fields:[{id:"source",label:"Source Related Object / Field",type:"field",fieldMap:all()}]},
      {name:"Sum Related Instances",abbr:"SRI",output:"Numeric / Currency",desc:"Sums a numeric or currency field across related instances that meet an optional condition.",example:"Sum of all invoice line amounts for a supplier",fields:[{id:"source",label:"Source Related Multi-Instance Field",type:"field",fieldMap:all()},{id:"sumField",label:"Field to Sum",type:"field",fieldMap:num()},{id:"condfield",label:"Filter Field (optional)",type:"field",fieldMap:all()},{id:"condop",label:"Filter Operator (optional)",type:"operator"},{id:"condval",label:"Filter Value (optional)",type:"field",fieldMap:all()}]}
    ]
  };
}

function buildOutput(fn, inputs) {
  const v=(id,fb)=>inputs[id]||fb;
  switch(fn.name) {
    case "Concatenate Text":{ const p=[v("part1","[Part 1]"),v("sep1",""),v("part2","[Part 2]"),v("sep2",""),v("part3","")].filter(Boolean); return{expr:p.join(" + "),explanation:`Joins the text parts in order. Wrap separators in quotes in Workday (e.g. " - "). Output: Text.`}; }
    case "Arithmetic Calculation": return{expr:`${v("operand1","[First Value / Field]")} ${v("operator","+")} ${v("operand2","[Second Value / Field]")}`,explanation:`Performs ${v("operator","arithmetic")} between the two values. Both must share the same currency code if currency fields are used.`};
    case "Date Difference": return{expr:`DATEDIFF(${v("unit","Days")}, ${v("start","[Start Date]")}, ${v("end","[End Date]")})`,explanation:`Returns the number of ${v("unit","days").toLowerCase()} between "${v("start","Start Date")}" and "${v("end","End Date")}". Output: Numeric.`};
    case "Format Date": return{expr:`FORMAT_DATE(${v("source","[Date Field]")}, "${v("mask","MM/DD/YYYY")}")`,explanation:`Formats "${v("source","the date field")}" using the mask "${v("mask","MM/DD/YYYY")}". Output: Text — cannot be used in date arithmetic after formatting.`};
    case "Format Number": return{expr:`FORMAT_NUMBER(${v("source","[Numeric Field]")}, "${v("mask","#,##0.00")}")`,explanation:`Formats "${v("source","the numeric field")}" as "${v("mask","#,##0.00")}". Output: Text.`};
    case "Format Text": return{expr:`FORMAT_TEXT(${v("source","[Source Field]")}, ${v("mask","UPPER")})`,explanation:`Applies the ${v("mask","UPPER")} mask to "${v("source","the source field")}".`};
    case "Lookup Related Value": return{expr:`LRV(${v("source","[Source Instance]")} → ${v("related","[Related Field]")})`,explanation:`Navigates from "${v("source","the source instance")}" to return "${v("related","the related field")}". Source must be single-instance.`};
    case "Extract Single Instance": return{expr:`ESI(${v("source","[Multi-Instance Field]")}${v("condfield","")? ` WHERE ${v("condfield","")} ${v("condop","=")} ${v("condval","")}` :""}${v("sort","")? ` ORDER BY ${v("sort","")} ${v("sortdir","Ascending")}` :""})`,explanation:`Extracts a single record from "${v("source","the multi-instance field")}".${v("condfield","")? ` Filtered where ${v("condfield","")} ${v("condop","=")} ${v("condval","")}.` :" No filter applied."}`};
    case "True/False Condition": return{expr:`${v("field","[Field]")} ${v("operator","=")} ${v("value","[Value]")}`,explanation:`Returns TRUE when "${v("field","the field")}" ${v("operator","=")} "${v("value","the value")}", FALSE otherwise.`};
    case "Evaluate Expression":{ let l=`IF ${v("cond1field","[Field]")} ${v("cond1op","=")} ${v("cond1val","[Value]")} THEN "${v("cond1return","[Return 1]")}"`; if(v("cond2field","")) l+=`\nELSE IF ${v("cond2field","")} ${v("cond2op","=")} ${v("cond2val","")} THEN "${v("cond2return","[Return 2]")}"`; l+=`\nELSE "${v("elsereturn","[Default]")}"`;  return{expr:l,explanation:`Evaluates conditions top-to-bottom, returns first match. Return type: ${v("returntype","Text")}. Put the most common outcome first.`}; }
    case "Increment or Decrement Date": return{expr:`${v("direction","Increment (Add)").includes("Decrement")?"DECREMENT":"INCREMENT"}_DATE(${v("source","[Date Field]")}, ${v("amount","N")} ${v("unit","Days")})`,explanation:`${v("direction","Increment (Add)").includes("Decrement")?"Subtracts":"Adds"} ${v("amount","N")} ${v("unit","Days").toLowerCase()} to "${v("source","the date field")}". Output: Date.`};
    case "Count Related Instances": return{expr:`COUNT(${v("source","[Related Field]")}${v("condfield","")? ` WHERE ${v("condfield","")} ${v("condop","=")} ${v("condval","")}` :""})`,explanation:`Counts instances of "${v("source","the related field")}"${v("condfield","")? ` where ${v("condfield","")} ${v("condop","=")} ${v("condval","")}` :" (no filter)"}. Output: Numeric.`};
    case "Sum Related Instances": return{expr:`SUM(${v("sumField","[Field to Sum]")} FROM ${v("source","[Related Instances]")}${v("condfield","")? ` WHERE ${v("condfield","")} ${v("condop","=")} ${v("condval","")}` :""})`,explanation:`Sums "${v("sumField","the field")}" across related instances of "${v("source","the source")}"${v("condfield","")? `, filtered where ${v("condfield","")} ${v("condop","=")} ${v("condval","")}` :""}.`};
    case "Lookup Value as of Date": return{expr:`LVAOD(${v("source","[Source Field]")}, AS OF ${v("date","[Date]")})`,explanation:`Returns the value of "${v("source","the field")}" as it existed on ${v("date","the specified date")}.`};
    case "Extract Multi-Instance": return{expr:`EMI_${v("operation","Subset")}(${v("source","[Multi-Instance Field]")}${v("condfield","")? ` WHERE ${v("condfield","")} ${v("condop","=")} ${v("condval","")}` :""})`,explanation:`Performs a ${v("operation","Subset")} on "${v("source","the multi-instance field")}".`};
    default: return{expr:fn.fields.map(f=>`${f.label}: ${inputs[f.id]||`[${f.label}]`}`).join(" | "),explanation:`Creates a ${fn.name} calculated field. Output: ${fn.output}.`};
  }
}

const OUTPUT_BADGE_COLORS = {"Text":"#e0f2fe|#0369a1","Numeric":"#dcfce7|#166534","Numeric / Currency":"#dcfce7|#166534","Currency":"#dcfce7|#166534","Date":"#fef9c3|#854d0e","True/False":"#f3e8ff|#6b21a8","Varies":"#f1f5f9|#475569","Single Instance":"#fce7f3|#9d174d","Multi-Instance":"#fce7f3|#9d174d"};
function badgeStyle(t){ const c=OUTPUT_BADGE_COLORS[t]||"#f1f5f9|#475569"; const[bg,fg]=c.split("|"); return{background:bg,color:fg,padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600,display:"inline-block"}; }

function detectDeps(expression, savedFields) {
  return savedFields.filter(sf => expression.includes(`CF: ${sf.name}`)).map(sf => sf.id);
}

function buildDepChain(sfId, savedFields, visited = new Set()) {
  if (visited.has(sfId)) return [];
  visited.add(sfId);
  const sf = savedFields.find(f => f.id === sfId);
  if (!sf) return [];
  const children = (sf.deps || []).map(depId => ({
    id: depId,
    field: savedFields.find(f => f.id === depId),
    children: buildDepChain(depId, savedFields, visited)
  })).filter(c => c.field);
  return children;
}

function getDependents(sfId, savedFields) {
  return savedFields.filter(sf => (sf.deps || []).includes(sfId));
}

function DepTree({ nodes, savedFields, depth = 0 }) {
  if (!nodes || nodes.length === 0) return null;
  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 16 }}>
      {nodes.map(node => (
        <div key={node.id}>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"3px 0" }}>
            <span style={{ color:"#94a3b8", fontSize:12 }}>└─</span>
            <span style={{ fontSize:12, color:"#0369a1", fontWeight:600 }}>CF: {node.field.name}</span>
            <span style={badgeStyle(node.field.outputType)}>{node.field.outputType}</span>
          </div>
          {node.children.length > 0 && <DepTree nodes={node.children} savedFields={savedFields} depth={depth+1} />}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [search, setSearch] = useState("");
  const [selectedFn, setSelectedFn] = useState(null);
  const [inputs, setInputs] = useState({});
  const [output, setOutput] = useState(null);
  const [activeTab, setActiveTab] = useState("builder");
  const [refSearch, setRefSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedFields, setSavedFields] = useState(() => {
    try { const raw = localStorage.getItem("workdayCalcFields_v1"); return raw ? JSON.parse(raw) : []; }
    catch { return []; }
  });
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveNote, setSaveNote] = useState("");
  const [saveManualDeps, setSaveManualDeps] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedDeps, setExpandedDeps] = useState({});

  useEffect(() => {
    try { localStorage.setItem("workdayCalcFields_v1", JSON.stringify(savedFields)); }
    catch {}
  }, [savedFields]);

  const FUNCTIONS = useMemo(() => buildFunctions(savedFields), [savedFields]);
  const ALL_FUNCTIONS = useMemo(() => Object.entries(FUNCTIONS).flatMap(([cat,fns]) => fns.map(f=>({...f,category:cat}))), [FUNCTIONS]);
  const filteredSearch = useMemo(() => { const q=search.toLowerCase(); return ALL_FUNCTIONS.filter(f=>f.name.toLowerCase().includes(q)||f.desc.toLowerCase().includes(q)||f.category.toLowerCase().includes(q)); }, [search,ALL_FUNCTIONS]);
  const refFiltered = useMemo(() => { const q=refSearch.toLowerCase(); return ALL_FUNCTIONS.filter(f=>f.name.toLowerCase().includes(q)||f.desc.toLowerCase().includes(q)||f.category.toLowerCase().includes(q)); }, [refSearch,ALL_FUNCTIONS]);

  const setInput=(id,val)=>setInputs(prev=>({...prev,[id]:val}));
  const selectFn=(fn)=>{ setSelectedFn(fn); setInputs({}); setOutput(null); setActiveTab("builder"); };

  const autoDeps = useMemo(() => output ? detectDeps(output.expr, savedFields) : [], [output, savedFields]);
  const allDepsForSave = useMemo(() => [...new Set([...autoDeps, ...saveManualDeps])], [autoDeps, saveManualDeps]);

  const saveField = () => {
    if (!saveName.trim() || !output) return;
    const newField = { id: Date.now(), name: saveName.trim(), functionName: selectedFn.name, abbr: selectedFn.abbr, outputType: selectedFn.output, expression: output.expr, explanation: output.explanation, note: saveNote.trim(), createdAt: new Date().toLocaleDateString(), deps: allDepsForSave };
    setSavedFields(prev => [...prev, newField]);
    setSaveModalOpen(false); setSaveName(""); setSaveNote(""); setSaveManualDeps([]);
  };

  const toggleManualDep = (id) => setSaveManualDeps(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);

  const deleteField = (id) => {
    setSavedFields(prev => prev.map(sf => ({ ...sf, deps: (sf.deps||[]).filter(d=>d!==id) })).filter(sf=>sf.id!==id));
    setDeleteConfirm(null);
  };

  const copy=(text)=>{ navigator.clipboard.writeText(text).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),1500); }); };

  const exportCSV = () => {
    const headers = ["Field Name","Function Type","Output Type","Expression","Explanation","Notes","Date Saved","Depends On"];
    const rows = savedFields.map(sf => {
      const depNames = (sf.deps||[]).map(id=>{ const f=savedFields.find(x=>x.id===id); return f?`CF: ${f.name}`:""; }).filter(Boolean).join("; ");
      return [`"${sf.name.replace(/"/g,'""')}"`,`"${sf.functionName.replace(/"/g,'""')}"`,`"${sf.outputType}"`,`"${sf.expression.replace(/"/g,'""')}"`,`"${sf.explanation.replace(/"/g,'""')}"`,`"${(sf.note||"").replace(/"/g,'""')}"`,`"${sf.createdAt}"`,`"${depNames}"`];
    });
    const csv=[headers.join(","),...rows.map(r=>r.join(","))].join("\n");
    const blob=new Blob([csv],{type:"text/csv"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="Workday_Calculated_Fields.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const win=window.open("","_blank");
    const rows=savedFields.map(sf=>{
      const depNames=(sf.deps||[]).map(id=>{ const f=savedFields.find(x=>x.id===id); return f?`CF: ${f.name}`:""; }).filter(Boolean);
      return `<div class="card"><div class="card-header"><div><div class="field-name">CF: ${sf.name}</div><div class="meta">${sf.functionName} &nbsp;·&nbsp; Saved ${sf.createdAt}</div></div><span class="badge">${sf.outputType}</span></div><div class="section-label">Expression</div><pre class="expr">${sf.expression}</pre><div class="section-label">Explanation</div><div class="explanation">${sf.explanation}</div>${sf.note?`<div class="section-label">Notes</div><div class="note">${sf.note}</div>`:""}${depNames.length>0?`<div class="section-label">Depends On</div><div class="deps">${depNames.join(", ")}</div>`:""}</div>`;
    }).join("");
    win.document.write(`<html><head><title>Workday Calculated Fields</title><style>body{font-family:system-ui,sans-serif;color:#1e293b;padding:32px;max-width:860px;margin:0 auto}h1{font-size:22px;color:#1e3a5f;margin-bottom:4px}.subtitle{font-size:13px;color:#64748b;margin-bottom:28px}.card{border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin-bottom:20px;break-inside:avoid}.card-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}.field-name{font-size:16px;font-weight:700;color:#1e3a5f}.meta{font-size:12px;color:#64748b;margin-top:3px}.badge{font-size:11px;font-weight:600;background:#e0f2fe;color:#0369a1;padding:3px 10px;border-radius:20px;white-space:nowrap}.section-label{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin:10px 0 4px}pre.expr{background:#1e293b;color:#7dd3fc;font-size:12px;padding:10px 14px;border-radius:6px;white-space:pre-wrap;word-break:break-all;margin:0}.explanation{font-size:13px;color:#334155;line-height:1.7}.note{font-size:12px;color:#78350f;background:#fefce8;border:1px solid #fde68a;border-radius:6px;padding:8px 12px}.deps{font-size:12px;color:#0369a1;background:#e0f2fe;border-radius:6px;padding:6px 10px}@media print{body{padding:16px}}</style></head><body><h1>⚙️ Workday Calculated Fields</h1><div class="subtitle">Exported ${new Date().toLocaleDateString()} &nbsp;·&nbsp; ${savedFields.length} field${savedFields.length!==1?"s":""}</div>${rows}<script>window.onload=()=>window.print();<\/script></body></html>`);
    win.document.close();
  };

  const renderField=(field)=>{ const val=inputs[field.id]||""; switch(field.type){ case "field": return <FieldSearch value={val} onChange={v=>setInput(field.id,v)} placeholder={field.placeholder||"Type to search or enter a field name…"} fieldMap={field.fieldMap}/>; case "datemask": return <MaskPicker masks={DATE_MASKS} value={val} onChange={v=>setInput(field.id,v)} placeholder="Type or pick a date mask…"/>; case "numbermask": return <MaskPicker masks={NUMBER_MASKS} value={val} onChange={v=>setInput(field.id,v)} placeholder="Type or pick a number mask…"/>; case "textmask": return <MaskPicker masks={TEXT_MASKS} value={val} onChange={v=>setInput(field.id,v)} placeholder="Type or pick a text mask…"/>; case "operator": return <OperatorPicker value={val} onChange={v=>setInput(field.id,v)}/>; case "select": return <select value={val} onChange={e=>setInput(field.id,e.target.value)} style={{width:"100%",padding:"8px 10px",borderRadius:6,border:"1px solid #cbd5e1",fontSize:13}}><option value="">Select…</option>{field.options.map(o=><option key={o}>{o}</option>)}</select>; case "textarea": return <textarea value={val} onChange={e=>setInput(field.id,e.target.value)} placeholder={field.placeholder} rows={4} style={{width:"100%",padding:"8px 10px",borderRadius:6,border:"1px solid #cbd5e1",fontSize:13,resize:"vertical",boxSizing:"border-box",fontFamily:"monospace"}}/>; default: return <input value={val} onChange={e=>setInput(field.id,e.target.value)} placeholder={field.placeholder||""} style={{width:"100%",padding:"8px 10px",borderRadius:6,border:"1px solid #cbd5e1",fontSize:13,boxSizing:"border-box"}}/>; } };

  const cats=Object.keys(FUNCTIONS);

  return (
    <div style={{fontFamily:"system-ui,sans-serif",maxWidth:980,margin:"0 auto",padding:"16px",color:"#1e293b"}}>
      <div style={{background:"linear-gradient(135deg,#1e3a5f 0%,#0f5ea3 100%)",borderRadius:12,padding:"20px 24px",marginBottom:20,color:"white"}}>
        <div style={{fontSize:20,fontWeight:700}}>⚙️ Workday Calculated Field Builder — Finance</div>
        <div style={{fontSize:13,opacity:0.85,marginTop:4}}>Report Writer · 29 Functions · GL · AP · Procurement · Projects · Assets · Banking · Budget</div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {[["builder","🔧 Field Builder"],["reference","📖 Function Reference"],["saved",`💾 My Saved Fields${savedFields.length>0?` (${savedFields.length})`:""}`]].map(([tab,label])=>(
          <button key={tab} onClick={()=>setActiveTab(tab)} style={{padding:"8px 20px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:14,background:activeTab===tab?"#0f5ea3":"#e2e8f0",color:activeTab===tab?"white":"#475569"}}>{label}</button>
        ))}
      </div>

      {activeTab==="builder"&&(
        <div style={{display:"grid",gridTemplateColumns:"270px 1fr",gap:16}}>
          <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:12,maxHeight:"80vh",overflowY:"auto"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search functions…" style={{width:"100%",padding:"8px 10px",borderRadius:6,border:"1px solid #cbd5e1",fontSize:13,marginBottom:10,boxSizing:"border-box"}}/>
            {search ? filteredSearch.map(fn=>(
              <div key={fn.name} onClick={()=>selectFn(fn)} style={{padding:"7px 10px",borderRadius:6,cursor:"pointer",fontSize:13,marginBottom:3,background:selectedFn?.name===fn.name?"#dbeafe":"transparent",borderLeft:selectedFn?.name===fn.name?"3px solid #0f5ea3":"3px solid transparent"}}>
                <span style={{fontWeight:600}}>{fn.name}</span><span style={{fontSize:11,color:"#94a3b8",marginLeft:6}}>{fn.category}</span>
              </div>
            )) : cats.map(cat=>(
              <div key={cat} style={{marginBottom:8}}>
                <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:1,padding:"4px 4px 2px"}}>{cat}</div>
                {FUNCTIONS[cat].map(fn=>(
                  <div key={fn.name} onClick={()=>selectFn(fn)} style={{padding:"6px 10px",borderRadius:6,cursor:"pointer",fontSize:13,marginBottom:2,background:selectedFn?.name===fn.name?"#dbeafe":"transparent",borderLeft:selectedFn?.name===fn.name?"3px solid #0f5ea3":"3px solid transparent",color:selectedFn?.name===fn.name?"#1e40af":"#334155"}}>
                    <span style={{fontWeight:selectedFn?.name===fn.name?600:400}}>{fn.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div>
            {!selectedFn?(
              <div style={{background:"#f8fafc",border:"2px dashed #cbd5e1",borderRadius:10,padding:40,textAlign:"center",color:"#94a3b8"}}>
                <div style={{fontSize:32,marginBottom:12}}>←</div>
                <div style={{fontWeight:600,fontSize:15}}>Select a function to get started</div>
                <div style={{fontSize:13,marginTop:6}}>Choose from the 29 Workday calculated field functions on the left</div>
              </div>
            ):(
              <div style={{background:"white",border:"1px solid #e2e8f0",borderRadius:10,padding:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div>
                    <div style={{fontSize:17,fontWeight:700,color:"#1e3a5f"}}>{selectedFn.name}</div>
                    <div style={{fontSize:12,color:"#64748b",marginTop:4,display:"flex",gap:6,flexWrap:"wrap"}}>
                      <span style={{background:"#e0f2fe",color:"#0369a1",padding:"2px 8px",borderRadius:20}}>{selectedFn.category}</span>
                      <span style={badgeStyle(selectedFn.output)}>Output: {selectedFn.output}</span>
                    </div>
                  </div>
                  <span style={{fontSize:16,fontWeight:700,color:"#94a3b8",background:"#f1f5f9",padding:"4px 10px",borderRadius:6}}>CF_{selectedFn.abbr}</span>
                </div>
                <div style={{background:"#f0f9ff",borderLeft:"3px solid #38bdf8",borderRadius:6,padding:"10px 14px",fontSize:13,color:"#0c4a6e",marginBottom:12}}>{selectedFn.desc}</div>
                <div style={{background:"#fefce8",border:"1px solid #fde68a",borderRadius:6,padding:"8px 12px",fontSize:12,color:"#78350f",marginBottom:18}}><strong>Example:</strong> {selectedFn.example}</div>
                <div style={{marginBottom:18}}>{selectedFn.fields.map(field=>(
                  <div key={field.id} style={{marginBottom:12}}>
                    <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:4}}>{field.label}</label>
                    {renderField(field)}
                  </div>
                ))}</div>
                <button onClick={()=>setOutput(buildOutput(selectedFn,inputs))} style={{background:"#0f5ea3",color:"white",border:"none",padding:"10px 24px",borderRadius:8,fontWeight:700,fontSize:14,cursor:"pointer",width:"100%"}}>Generate Expression & Explanation</button>
                {output&&(
                  <div style={{marginTop:20}}>
                    <div style={{background:"#1e293b",borderRadius:8,padding:14,marginBottom:12,position:"relative"}}>
                      <div style={{fontSize:11,color:"#94a3b8",marginBottom:6,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Expression</div>
                      <pre style={{color:"#7dd3fc",fontSize:13,margin:0,whiteSpace:"pre-wrap",wordBreak:"break-all",fontFamily:"monospace"}}>{output.expr}</pre>
                      <button onClick={()=>copy(output.expr)} style={{position:"absolute",top:10,right:10,background:copied?"#22c55e":"#334155",color:"white",border:"none",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",fontWeight:600}}>{copied?"Copied!":"Copy"}</button>
                    </div>
                    <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:14,marginBottom:12}}>
                      <div style={{fontSize:11,color:"#166534",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Step-by-Step Explanation</div>
                      <div style={{fontSize:13,color:"#14532d",lineHeight:1.7}}>{output.explanation}</div>
                    </div>
                    {autoDeps.length>0&&(
                      <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:8,padding:"10px 14px",marginBottom:12}}>
                        <div style={{fontSize:11,fontWeight:700,color:"#1e40af",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>🔗 Auto-Detected Dependencies</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                          {autoDeps.map(id=>{ const f=savedFields.find(x=>x.id===id); return f?<span key={id} style={{background:"#dbeafe",color:"#1e40af",padding:"2px 10px",borderRadius:20,fontSize:12,fontWeight:600}}>CF: {f.name}</span>:null; })}
                        </div>
                      </div>
                    )}
                    <button onClick={()=>setSaveModalOpen(true)} style={{background:"#0f5ea3",color:"white",border:"none",padding:"10px 20px",borderRadius:8,fontWeight:600,fontSize:13,cursor:"pointer"}}>💾 Save This Calculated Field</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab==="reference"&&(
        <div>
          <input value={refSearch} onChange={e=>setRefSearch(e.target.value)} placeholder="Search all 29 functions…" style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid #cbd5e1",fontSize:14,marginBottom:16,boxSizing:"border-box"}}/>
          {(refSearch?[{cat:"Results",fns:refFiltered}]:Object.entries(FUNCTIONS).map(([cat,fns])=>({cat,fns}))).map(({cat,fns})=>(
            <div key={cat} style={{marginBottom:24}}>
              <div style={{fontSize:13,fontWeight:700,color:"#0f5ea3",textTransform:"uppercase",letterSpacing:1,marginBottom:10,borderBottom:"2px solid #bfdbfe",paddingBottom:4}}>{cat}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:10}}>
                {fns.map(fn=>(
                  <div key={fn.name} onClick={()=>selectFn(fn)} style={{background:"white",border:"1px solid #e2e8f0",borderRadius:8,padding:14,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 2px 8px rgba(15,94,163,0.15)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <div style={{fontWeight:700,fontSize:13,color:"#1e3a5f"}}>{fn.name}</div>
                      <span style={{fontSize:11,color:"#64748b",background:"#f1f5f9",padding:"2px 7px",borderRadius:20}}>CF_{fn.abbr}</span>
                    </div>
                    <div style={{fontSize:12,color:"#475569",lineHeight:1.5,marginBottom:8}}>{fn.desc}</div>
                    <div style={{marginBottom:6}}><span style={badgeStyle(fn.output)}>Output: {fn.output}</span></div>
                    <div style={{fontSize:11,color:"#92400e",background:"#fef9c3",padding:"4px 8px",borderRadius:5,marginBottom:8}}>{fn.example}</div>
                    <div style={{fontSize:11,color:"#0f5ea3",fontWeight:600}}>→ Use in Builder</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab==="saved"&&(
        <div>
          {savedFields.length===0?(
            <div style={{background:"#f8fafc",border:"2px dashed #cbd5e1",borderRadius:10,padding:48,textAlign:"center",color:"#94a3b8"}}>
              <div style={{fontSize:36,marginBottom:12}}>💾</div>
              <div style={{fontWeight:600,fontSize:15}}>No saved calculated fields yet</div>
              <div style={{fontSize:13,marginTop:6}}>Build a calculated field, generate the expression, and click "Save This Calculated Field"</div>
            </div>
          ):(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontSize:13,color:"#64748b"}}>{savedFields.length} saved field{savedFields.length!==1?"s":""}</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={exportCSV} style={{background:"#f1f5f9",color:"#1e293b",border:"1px solid #cbd5e1",padding:"7px 14px",borderRadius:8,fontWeight:600,fontSize:13,cursor:"pointer"}}>⬇ Export CSV</button>
                  <button onClick={exportPDF} style={{background:"#1e3a5f",color:"white",border:"none",padding:"7px 14px",borderRadius:8,fontWeight:600,fontSize:13,cursor:"pointer"}}>🖨 Export PDF</button>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))",gap:14}}>
                {savedFields.map(sf=>{
                  const depChain=buildDepChain(sf.id,savedFields);
                  const dependents=getDependents(sf.id,savedFields);
                  const isExpanded=expandedDeps[sf.id];
                  return (
                    <div key={sf.id} style={{background:"white",border:"1px solid #e2e8f0",borderRadius:10,padding:16}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                        <div>
                          <div style={{fontWeight:700,fontSize:14,color:"#1e3a5f"}}>CF: {sf.name}</div>
                          <div style={{fontSize:11,color:"#64748b",marginTop:3}}>{sf.functionName} · Saved {sf.createdAt}</div>
                        </div>
                        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
                          <span style={badgeStyle(sf.outputType)}>{sf.outputType}</span>
                          <button onClick={()=>setDeleteConfirm(sf.id)} style={{background:"none",border:"1px solid #fca5a5",color:"#ef4444",borderRadius:6,padding:"2px 8px",fontSize:11,cursor:"pointer"}}>Delete</button>
                        </div>
                      </div>
                      <div style={{background:"#1e293b",borderRadius:6,padding:10,marginBottom:10}}>
                        <pre style={{color:"#7dd3fc",fontSize:12,margin:0,whiteSpace:"pre-wrap",wordBreak:"break-all",fontFamily:"monospace"}}>{sf.expression}</pre>
                      </div>
                      <div style={{fontSize:12,color:"#475569",lineHeight:1.6,marginBottom:sf.note||depChain.length>0?8:0}}>{sf.explanation}</div>
                      {sf.note&&<div style={{background:"#fefce8",border:"1px solid #fde68a",borderRadius:6,padding:"6px 10px",fontSize:12,color:"#78350f",marginBottom:8}}><strong>Note:</strong> {sf.note}</div>}

                      {(sf.deps||[]).length>0&&(
                        <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:8,padding:"8px 12px",marginBottom:8}}>
                          <button onClick={()=>setExpandedDeps(prev=>({...prev,[sf.id]:!prev[sf.id]}))} style={{background:"none",border:"none",cursor:"pointer",width:"100%",textAlign:"left",padding:0,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{fontSize:11,fontWeight:700,color:"#0369a1",textTransform:"uppercase",letterSpacing:1}}>🔗 Depends On ({(sf.deps||[]).length})</span>
                            <span style={{fontSize:11,color:"#0369a1"}}>{isExpanded?"▲ Hide":"▼ Show"}</span>
                          </button>
                          {isExpanded&&<div style={{marginTop:8}}><DepTree nodes={depChain} savedFields={savedFields}/></div>}
                        </div>
                      )}

                      {dependents.length>0&&(
                        <div style={{background:"#fdf4ff",border:"1px solid #e9d5ff",borderRadius:8,padding:"8px 12px",marginBottom:8}}>
                          <div style={{fontSize:11,fontWeight:700,color:"#7e22ce",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>⬆ Used By ({dependents.length})</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                            {dependents.map(d=><span key={d.id} style={{background:"#f3e8ff",color:"#7e22ce",padding:"2px 9px",borderRadius:20,fontSize:12,fontWeight:600}}>CF: {d.name}</span>)}
                          </div>
                        </div>
                      )}

                      {deleteConfirm===sf.id&&(
                        <div style={{marginTop:10,background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:8,padding:10}}>
                          {dependents.length>0&&(
                            <div style={{background:"#fef2f2",borderRadius:6,padding:"6px 0",marginBottom:8}}>
                              <div style={{fontSize:12,fontWeight:700,color:"#b91c1c",marginBottom:4}}>⚠️ Dependency Warning</div>
                              <div style={{fontSize:12,color:"#b91c1c"}}>This field is used by {dependents.length} other calc field{dependents.length!==1?"s":""}:</div>
                              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:4}}>
                                {dependents.map(d=><span key={d.id} style={{background:"#fecaca",color:"#991b1b",padding:"1px 8px",borderRadius:20,fontSize:11,fontWeight:600}}>CF: {d.name}</span>)}
                              </div>
                              <div style={{fontSize:12,color:"#b91c1c",marginTop:6}}>Deleting it will remove this dependency link from those fields.</div>
                            </div>
                          )}
                          <div style={{fontSize:12,color:"#b91c1c",marginBottom:8}}>Delete "CF: {sf.name}"?</div>
                          <div style={{display:"flex",gap:6}}>
                            <button onClick={()=>deleteField(sf.id)} style={{background:"#ef4444",color:"white",border:"none",borderRadius:6,padding:"4px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>Yes, Delete</button>
                            <button onClick={()=>setDeleteConfirm(null)} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:6,padding:"4px 12px",fontSize:12,cursor:"pointer"}}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {saveModalOpen&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"white",borderRadius:12,padding:28,width:440,boxShadow:"0 8px 32px rgba(0,0,0,0.2)",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{fontSize:17,fontWeight:700,color:"#1e3a5f",marginBottom:4}}>💾 Save Calculated Field</div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:18}}>Output type: <span style={badgeStyle(selectedFn?.output)}>{selectedFn?.output}</span> — will appear in matching dropdowns</div>
            <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:4}}>Field Name <span style={{color:"#ef4444"}}>*</span></label>
            <input value={saveName} onChange={e=>setSaveName(e.target.value)} placeholder="e.g. Budget Variance %" style={{width:"100%",padding:"8px 10px",borderRadius:6,border:"1px solid #cbd5e1",fontSize:13,marginBottom:14,boxSizing:"border-box"}}/>
            <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:4}}>Notes (optional)</label>
            <textarea value={saveNote} onChange={e=>setSaveNote(e.target.value)} placeholder="e.g. Used in the monthly budget variance report" rows={2} style={{width:"100%",padding:"8px 10px",borderRadius:6,border:"1px solid #cbd5e1",fontSize:13,marginBottom:14,resize:"vertical",boxSizing:"border-box"}}/>

            {autoDeps.length>0&&(
              <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:8,padding:"10px 12px",marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:"#1e40af",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>🔗 Auto-Detected Dependencies</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {autoDeps.map(id=>{ const f=savedFields.find(x=>x.id===id); return f?<span key={id} style={{background:"#dbeafe",color:"#1e40af",padding:"2px 10px",borderRadius:20,fontSize:12,fontWeight:600}}>CF: {f.name}</span>:null; })}
                </div>
              </div>
            )}

            {savedFields.length>0&&(
              <div style={{marginBottom:18}}>
                <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>Additional Dependencies (optional)</label>
                <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:150,overflowY:"auto",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 10px"}}>
                  {savedFields.map(sf=>{
                    const isAuto=autoDeps.includes(sf.id);
                    const isManual=saveManualDeps.includes(sf.id);
                    return (
                      <label key={sf.id} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,cursor:isAuto?"not-allowed":"pointer",opacity:isAuto?0.5:1}}>
                        <input type="checkbox" checked={isAuto||isManual} disabled={isAuto} onChange={()=>!isAuto&&toggleManualDep(sf.id)}/>
                        <span style={{color:"#0369a1",fontWeight:600}}>CF: {sf.name}</span>
                        <span style={badgeStyle(sf.outputType)}>{sf.outputType}</span>
                        {isAuto&&<span style={{fontSize:10,color:"#94a3b8"}}>(auto)</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{display:"flex",gap:8}}>
              <button onClick={saveField} disabled={!saveName.trim()} style={{flex:1,background:saveName.trim()?"#0f5ea3":"#94a3b8",color:"white",border:"none",padding:"10px",borderRadius:8,fontWeight:700,fontSize:14,cursor:saveName.trim()?"pointer":"not-allowed"}}>Save Field</button>
              <button onClick={()=>{ setSaveModalOpen(false); setSaveName(""); setSaveNote(""); setSaveManualDeps([]); }} style={{flex:1,background:"#f1f5f9",color:"#475569",border:"none",padding:"10px",borderRadius:8,fontWeight:600,fontSize:14,cursor:"pointer"}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
