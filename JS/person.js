// 1. Utility functions
function loadMembers() {
  var data = localStorage.getItem("familyMembers");
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
  var members = loadMembers();
  var spouseSelect = document.getElementById("spouseSelect");
  var parentsSelect = document.getElementById("parentsSelect");
  var childrenSelect = document.getElementById("childrenSelect");
  if (!spouseSelect || !parentsSelect || !childrenSelect) return;

  spouseSelect.innerHTML = "<option value=''>— none —</option>";
  parentsSelect.innerHTML = ""; // no placeholder for multiple
  childrenSelect.innerHTML = "";

  members.forEach((m) => {
    // spouse dropdown
    var sOpt = document.createElement("option");
    sOpt.value = m.id;
    sOpt.text = m.fullName;
    spouseSelect.add(sOpt);

    // parents multi-select
    var pOpt = document.createElement("option");
    pOpt.value = m.id;
    pOpt.text = m.fullName;
    parentsSelect.add(pOpt);

    // children multi-select
    var cOpt = document.createElement("option");
    cOpt.value = m.id;
    cOpt.text = m.fullName;
    childrenSelect.add(cOpt);
  });
}

// 4. Handle Add-Member form
function initAddMemberPage() {
  var form = document.getElementById("addMemberForm");
  if (!form) return;

  populateRelationSelects();

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var fullName = document.getElementById("fullName").value.trim();
    var photoUrl = document.getElementById("photoUrl").value;
    var category = document.getElementById("category").value;
    var spouseId = document.getElementById("spouseSelect").value || null;
    var parentIds = Array.from(
      document.getElementById("parentsSelect").selectedOptions
    ).map((opt) => opt.value);
    var childrenIds = Array.from(
      document.getElementById("childrenSelect").selectedOptions
    ).map((opt) => opt.value);

    var newMember = {
      id: generateId(),
      fullName,
      photoUrl,
      category,
      spouseId,
      parentIds,
      childrenIds,
    };

    var members = loadMembers();

    // update each chosen parent
    parentIds.forEach((pid) => {
      var parent = members.find((m) => m.id === pid);
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
  var card = document.createElement("div");
  card.className = "member-card bg-white shadow rounded p-4 relative";
  card.dataset.id = member.id;

  // Photo
  var img = document.createElement("img");
  img.src = member.photoUrl || "placeholder.jpg";
  img.alt = member.fullName;
  img.className = "w-full h-32 object-cover mb-2 rounded";
  card.appendChild(img);

  // Name
  var nameEl = document.createElement("h2");
  nameEl.textContent = member.fullName;
  nameEl.className = "text-lg font-semibold mb-2";
  card.appendChild(nameEl);

  // Category
  if (member.category) {
    var catEl = document.createElement("p");
    catEl.textContent = member.category;
    catEl.className = "text-sm italic text-gray-600 mb-2";
    card.appendChild(catEl);
  }

  // Spouse
  var spouses = [];
  if (member.spouseId) {
    var s = allMembers.find((m) => m.id === member.spouseId);
    if (s) spouses.push(s);
  }
  allMembers.forEach((m) => {
    if (m.spouseId === member.id && m.id !== member.spouseId) spouses.push(m);
  });
  spouses.forEach((sp) => {
    var p = document.createElement("p");
    p.className = "text-sm mb-1";
    p.innerHTML = `<strong>Spouse:</strong> ${sp.fullName}`;
    card.appendChild(p);
  });

  // Parents
  if (member.parentIds && member.parentIds.length) {
    var pP = document.createElement("p");
    pP.className = "text-sm mb-1";
    pP.innerHTML = "<strong>Parents:</strong> ";
    member.parentIds.forEach((pid, i) => {
      var par = allMembers.find((m) => m.id === pid);
      if (!par) return;
      var link = document.createElement("span");
      link.textContent = par.fullName;
      pP.appendChild(link);
      if (i < member.parentIds.length - 1)
        pP.appendChild(document.createTextNode(", "));
    });
    card.appendChild(pP);
  }

  // Children
  if (member.childrenIds && member.childrenIds.length) {
    var pC = document.createElement("p");
    pC.className = "text-sm";
    pC.innerHTML = "<strong>Children:</strong> ";
    member.childrenIds.forEach((cid, i) => {
      var ch = allMembers.find((m) => m.id === cid);
      if (!ch) return;
      var link = document.createElement("a");
      link.href =
        ch.category === "Maternal" ? "maternal.html" : "view paternal.html";
      link.textContent = ch.fullName;
      link.className = "underline text-blue-600";
      pC.appendChild(link);
      if (i < member.childrenIds.length - 1)
        pC.appendChild(document.createTextNode(", "));
    });
    card.appendChild(pC);
  }

  // Edit/Delete
  var btns = document.createElement("div");
  btns.className = "btn-container";
  var edit = document.createElement("button");
  edit.textContent = "Edit";
  edit.className = "edit-btn";
  edit.onclick = () =>
    (window.location.href = "add family member.html?id=" + member.id);
  var del = document.createElement("button");
  del.textContent = "Delete";
  del.className = "delete-btn";
  del.onclick = () => {
    if (confirm(`Delete ${member.fullName}?`)) {
      var rest = loadMembers().filter((m) => m.id !== member.id);
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
  var grid = document.getElementById("maternal-grid");
  if (!grid) return;
  var ms = loadMembers().filter((m) => m.category === "Maternal");
  grid.innerHTML = "";
  ms.forEach((m) => grid.appendChild(createMemberCard(m, loadMembers())));
}
function initHomePage() {
  var grid = document.getElementById("family-tree-grid");
  if (!grid) return;
  var ms = loadMembers();
  grid.innerHTML = "";
  ms.forEach((m) => grid.appendChild(createMemberCard(m, ms)));
}

// 7. Wire up
document.addEventListener("DOMContentLoaded", function () {
  initAddMemberPage();
  initMaternalPage();
  initHomePage();
});

//SIGMAN SKIBBI THIS IS A WORK IS PROGRESS SO WE CAN LERN TO CODE
