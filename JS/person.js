// 1. Utility functions
function loadMembers() {
  const data = localStorage.getItem("familyMembers");
  return data ? JSON.parse(data) : [];
}

function saveMembers(members) {
  localStorage.setItem("familyMembers", JSON.stringify(members));
}

// 2. ID generator
function generateId() {
  return Date.now().toString();
}

// 3. Populate relation selects
function populateRelationSelects() {
  const members = loadMembers();
  const spouseSelect = document.getElementById("spouseSelect");
  const parentsSelect = document.getElementById("parentsSelect");
  const childrenSelect = document.getElementById("childrenSelect");
  if (!spouseSelect || !parentsSelect || !childrenSelect) return;

  spouseSelect.innerHTML = "<option value=''>— none —</option>";
  parentsSelect.innerHTML = "";
  childrenSelect.innerHTML = "";

  members.forEach((m) => {
    // spouse dropdown
    const sOpt = document.createElement("option");
    sOpt.value = m.id;
    sOpt.text = m.fullName;
    spouseSelect.add(sOpt);

    // parents multi-select
    const pOpt = document.createElement("option");
    pOpt.value = m.id;
    pOpt.text = m.fullName;
    parentsSelect.add(pOpt);

    // children multi-select
    const cOpt = document.createElement("option");
    cOpt.value = m.id;
    cOpt.text = m.fullName;
    childrenSelect.add(cOpt);
  });
}

// 4. Handle Add-Member form
function initAddMemberPage() {
  const form = document.getElementById("addMemberForm");
  if (!form) return;

  populateRelationSelects();

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const photoUrl = document.getElementById("photoUrl").value;
    const category = document.getElementById("category").value;
    const spouseId = document.getElementById("spouseSelect").value || null;
    const parentIds = Array.from(
      document.getElementById("parentsSelect").selectedOptions
    ).map((o) => o.value);
    const childrenIds = Array.from(
      document.getElementById("childrenSelect").selectedOptions
    ).map((o) => o.value);

    const newMember = {
      id: generateId(),
      fullName,
      photoUrl,
      category,
      spouseId,
      parentIds,
      childrenIds,
    };

    const members = loadMembers();

    // update each chosen parent
    parentIds.forEach((pid) => {
      const parent = members.find((m) => m.id === pid);
      if (!parent) return;
      parent.childrenIds = parent.childrenIds || [];
      parent.childrenIds.push(newMember.id);
    });

    members.push(newMember);
    saveMembers(members);

    alert("Member saved!");
    form.reset();
    populateRelationSelects();
  });
}

// 5. Create a member card
function createMemberCard(member, allMembers) {
  const card = document.createElement("div");
  card.className = "member-card bg-white shadow rounded p-4 relative";
  card.dataset.id = member.id;

  // Photo
  const img = document.createElement("img");
  img.src = member.photoUrl || "placeholder.jpg";
  img.alt = member.fullName;
  img.className = "w-full h-32 object-cover mb-2 rounded";
  card.appendChild(img);

  // Name
  const nameEl = document.createElement("h2");
  nameEl.textContent = member.fullName;
  nameEl.className = "text-lg font-semibold mb-2";
  card.appendChild(nameEl);

  // Category
  if (member.category) {
    const catEl = document.createElement("p");
    catEl.textContent = member.category;
    catEl.className = "text-sm italic text-gray-600 mb-2";
    card.appendChild(catEl);
  }

  // Spouse
  const spouses = [];
  if (member.spouseId) {
    const s = allMembers.find((m) => m.id === member.spouseId);
    if (s) spouses.push(s);
  }
  allMembers.forEach((m) => {
    if (m.spouseId === member.id && m.id !== member.spouseId) spouses.push(m);
  });
  spouses.forEach((sp) => {
    const p = document.createElement("p");
    p.className = "text-sm mb-1";
    p.innerHTML = `<strong>Spouse:</strong> ${sp.fullName}`;
    card.appendChild(p);
  });

  // Parents
  if (member.parentIds && member.parentIds.length) {
    const pP = document.createElement("p");
    pP.className = "text-sm mb-1";
    pP.innerHTML = "<strong>Parents:</strong> ";
    member.parentIds.forEach((pid, i) => {
      const par = allMembers.find((m) => m.id === pid);
      if (!par) return;
      const span = document.createElement("span");
      span.textContent = par.fullName;
      pP.appendChild(span);
      if (i < member.parentIds.length - 1)
        pP.appendChild(document.createTextNode(", "));
    });
    card.appendChild(pP);
  }

  // Children
  if (member.childrenIds && member.childrenIds.length) {
    const pC = document.createElement("p");
    pC.className = "text-sm";
    pC.innerHTML = "<strong>Children:</strong> ";
    member.childrenIds.forEach((cid, i) => {
      const ch = allMembers.find((m) => m.id === cid);
      if (!ch) return;
      const link = document.createElement("a");
      link.href =
        ch.category === "Maternal" ? "maternal.html" : "paternal.html";
      link.textContent = ch.fullName;
      link.className = "underline text-blue-600";
      pC.appendChild(link);
      if (i < member.childrenIds.length - 1)
        pC.appendChild(document.createTextNode(", "));
    });
    card.appendChild(pC);
  }

  // Edit/Delete buttons
  const btns = document.createElement("div");
  btns.className = "btn-container";

  const edit = document.createElement("button");
  edit.textContent = "Edit";
  edit.className = "edit-btn";
  edit.onclick = () =>
    (window.location.href = "add family member.html?id=" + member.id);

  const del = document.createElement("button");
  del.textContent = "Delete";
  del.className = "delete-btn";
  del.onclick = () => {
    if (confirm(`Delete ${member.fullName}?`)) {
      const rest = loadMembers().filter((m) => m.id !== member.id);
      saveMembers(rest);
      card.remove();
    }
  };

  btns.append(edit, del);
  card.appendChild(btns);

  return card;
}

// 6. Render pages
function initMaternalPage() {
  const grid = document.getElementById("maternal-grid");
  if (!grid) return;
  const ms = loadMembers().filter((m) => m.category === "Maternal");
  grid.innerHTML = "";
  ms.forEach((m) => grid.appendChild(createMemberCard(m, loadMembers())));
}

function initPaternalPage() {
  const grid = document.getElementById("paternal-grid");
  if (!grid) return;
  const ms = loadMembers().filter((m) => m.category === "Paternal");
  grid.innerHTML = "";
  ms.forEach((m) => grid.appendChild(createMemberCard(m, loadMembers())));
}

function initHomePage() {
  const grid = document.getElementById("family-tree-grid");
  if (!grid) return;
  const ms = loadMembers();
  grid.innerHTML = "";
  ms.forEach((m) => grid.appendChild(createMemberCard(m, ms)));
}

// 7. Wire up
document.addEventListener("DOMContentLoaded", function () {
  initAddMemberPage();
  initMaternalPage();
  initPaternalPage();
  initHomePage();
});

//SIGMAN SKIBBI THIS IS A WORK IS PROGRESS SO WE CAN LERN TO CODE
