// home.js

// Re-use loadMembers() and createMemberCard() from person.js

function initHomePage() {
  var grid = document.getElementById("family-tree-grid");
  if (!grid) return;

  var all = loadMembers();
  grid.innerHTML = "";

  all.forEach(function (m) {
    // showCategory = true, showEditBtn = true
    grid.appendChild(createMemberCard(m, all, true, true));
  });
}

function initSearch() {
  var searchBar = document.getElementById("searchBar");
  if (!searchBar) return;

  searchBar.addEventListener("input", function (e) {
    var q = e.target.value.toLowerCase();
    var cards = document.querySelectorAll("#family-tree-grid .member-card");
    cards.forEach(function (card) {
      var name = card.dataset.fullname.toLowerCase();
      card.style.display = name.indexOf(q) > -1 ? "" : "none";
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initHomePage();
  initSearch();
});

// js/person.js

// 1. Load & save helpers
function loadMembers() {
  var data = localStorage.getItem("familyMembers");
  if (data) {
    return JSON.parse(data);
  }
  return [];
}
function saveMembers(members) {
  localStorage.setItem("familyMembers", JSON.stringify(members));
}

// 2. ID + URL‐param helpers
function generateId() {
  return "" + new Date().getTime();
}
function getEditId() {
  var qs = window.location.search; // "?id=123"
  if (qs.length < 1) return null;
  qs = qs.substring(1); // "id=123"
  var parts = qs.split("&");
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].split("=");
    if (p[0] === "id") {
      return decodeURIComponent(p[1]);
    }
  }
  return null;
}

// 3. Populate spouse & children selects on Add/Edit form
function populateRelationSelects() {
  var all = loadMembers();
  var spouseSel = document.getElementById("spouseSelect");
  var childrenSel = document.getElementById("childrenSelect");
  if (!spouseSel || !childrenSel) return;

  // Clear old options
  while (spouseSel.options.length > 1) spouseSel.remove(1);
  childrenSel.innerHTML = "";

  for (var i = 0; i < all.length; i++) {
    var m = all[i];

    var o1 = document.createElement("option");
    o1.value = m.id;
    o1.text = m.fullName;
    spouseSel.add(o1);

    var o2 = document.createElement("option");
    o2.value = m.id;
    o2.text = m.fullName;
    childrenSel.add(o2);
  }
}

// 4. Init the Add‐Member (and Edit) page
function initAddMemberPage() {
  var form = document.getElementById("addMemberForm");
  if (!form) return;

  populateRelationSelects();

  var editId = getEditId();
  var members = loadMembers();
  var editing = null;

  // If we have ?id=... fill form for editing
  if (editId) {
    for (var i = 0; i < members.length; i++) {
      if (members[i].id === editId) {
        editing = members[i];
        break;
      }
    }
  }
  if (editing) {
    // Fill fields safely (check each element exists)
    var el;
    el = document.getElementById("fullName");
    if (el) el.value = editing.fullName;

    el = document.getElementById("age");
    if (el) el.value = editing.age || "";

    el = document.getElementById("category");
    if (el) el.value = editing.category;

    el =
      document.getElementById("photoUrl") || document.getElementById("photo");
    if (el) el.value = editing.photoUrl || "";

    el = document.getElementById("spouseSelect");
    if (el) el.value = editing.spouseId || "";

    var kids = document.getElementById("childrenSelect");
    if (kids) {
      for (var j = 0; j < kids.options.length; j++) {
        var opt = kids.options[j];
        opt.selected = editing.childrenIds.indexOf(opt.value) > -1;
      }
    }
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.textContent = "Save Changes";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Gather values
    var fullName = document.getElementById("fullName")?.value.trim() || "";
    var age = document.getElementById("age")?.value || "";
    var category = document.getElementById("category")?.value || "";
    var photoEl =
      document.getElementById("photoUrl") || document.getElementById("photo");
    var photoUrl = photoEl?.value || "";
    var spouseId = document.getElementById("spouseSelect")?.value || null;

    var childrenIds = [];
    var kidsEl = document.getElementById("childrenSelect");
    if (kidsEl) {
      for (var k = 0; k < kidsEl.options.length; k++) {
        if (kidsEl.options[k].selected) {
          childrenIds.push(kidsEl.options[k].value);
        }
      }
    }

    if (editing) {
      // Update existing member
      editing.fullName = fullName;
      editing.age = age;
      editing.category = category;
      editing.photoUrl = photoUrl;
      editing.spouseId = spouseId;
      editing.childrenIds = childrenIds;
    } else {
      // Add new member
      members.push({
        id: generateId(),
        fullName: fullName,
        age: age,
        category: category,
        photoUrl: photoUrl,
        spouseId: spouseId,
        childrenIds: childrenIds,
      });
    }

    saveMembers(members);
    alert("Saved!");
    window.location.href = "index.html";
  });
}

// 5. Create a member card (used by Maternal page)
function createMemberCard(member, all) {
  var card = document.createElement("div");
  card.className = "member-card bg-white shadow rounded p-4";
  card.dataset.fullname = member.fullName;

  // Photo
  var img = document.createElement("img");
  img.src = member.photoUrl || "placeholder.jpg";
  img.alt = member.fullName;
  img.className = "w-40 h-32 object-cover mb-2 rounded";
  card.appendChild(img);

  // Name
  var h2 = document.createElement("h2");
  h2.textContent = member.fullName;
  h2.className = "text-lg font-semibold mb-1";
  card.appendChild(h2);

  // Spouse
  if (member.spouseId) {
    var s = all.find(function (x) {
      return x.id === member.spouseId;
    });
    if (s) {
      var p1 = document.createElement("p");
      p1.className = "text-sm mb-1";
      p1.innerHTML = "<strong>Spouse:</strong> " + s.fullName;
      card.appendChild(p1);
    }
  }

  // Children
  if (member.childrenIds && member.childrenIds.length) {
    var p2 = document.createElement("p");
    p2.className = "text-sm";
    p2.innerHTML = "<strong>Children:</strong> ";
    for (var j = 0; j < member.childrenIds.length; j++) {
      var cid = member.childrenIds[j];
      var c = all.find(function (x) {
        return x.id === cid;
      });
      if (c) {
        var a = document.createElement("a");
        a.href = "view pateranal.html";
        a.textContent = c.fullName;
        a.className = "underline text-blue-600";
        p2.appendChild(a);
        if (j < member.childrenIds.length - 1) {
          p2.appendChild(document.createTextNode(", "));
        }
      }
    }
    card.appendChild(p2);
  }

  return card;
}

// 6. Init the Maternal page (now defined!)
function initMaternalPage() {
  var grid = document.getElementById("maternal-grid");
  if (!grid) return;

  var all = loadMembers();
  var matIds = [];

  // 1) collect maternal ids
  for (var i = 0; i < all.length; i++) {
    if (all[i].category === "Maternal") {
      matIds.push(all[i].id);
    }
  }
  // 2) add spouses of those maternal members
  for (var j = 0; j < all.length; j++) {
    if (all[j].spouseId && matIds.indexOf(all[j].spouseId) > -1) {
      matIds.push(all[j].id);
    }
  }
  // 3) dedupe
  var unique = [];
  for (var k = 0; k < matIds.length; k++) {
    if (unique.indexOf(matIds[k]) === -1) {
      unique.push(matIds[k]);
    }
  }

  // 4) render
  grid.innerHTML = "";
  for (var m = 0; m < all.length; m++) {
    if (unique.indexOf(all[m].id) > -1) {
      grid.appendChild(createMemberCard(all[m], all));
    }
  }
}

// 7. Wire it all up when the page loads
document.addEventListener("DOMContentLoaded", function () {
  initAddMemberPage();
  initMaternalPage();
  // home.js will handle the home page tree
});

//SIGMA THIS IS A WIP//
