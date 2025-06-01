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

// Delete member function
function deleteMember(memberId) {
  var members = loadMembers();

  // Remove the member
  members = members.filter(function (member) {
    return member.id !== memberId;
  });

  // Clean up references to deleted member
  for (var i = 0; i < members.length; i++) {
    var member = members[i];

    // Remove spouse reference
    if (member.spouseId === memberId) {
      member.spouseId = null;
    }

    // Remove from children arrays
    if (member.childrenIds && member.childrenIds.length > 0) {
      member.childrenIds = member.childrenIds.filter(function (childId) {
        return childId !== memberId;
      });
    }
  }

  saveMembers(members);

  // Refresh the current page
  if (window.location.pathname.includes("homepage")) {
    initHomePage();
  } else if (window.location.pathname.includes("maternal")) {
    initMaternalPage();
  } else {
    // Reload the page
    window.location.reload();
  }
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

// 4. Handle file upload and convert to base64
function handleFileUpload(fileInput, callback) {
  var file = fileInput.files[0];
  if (!file) {
    callback("");
    return;
  }

  // Check if it's an image
  if (!file.type.startsWith("image/")) {
    alert("Please select an image file");
    callback("");
    return;
  }

  // Check file size (limit to 2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert("Image size should be less than 2MB");
    callback("");
    return;
  }

  var reader = new FileReader();
  reader.onload = function (e) {
    callback(e.target.result); // This is the base64 data URL
  };
  reader.onerror = function () {
    alert("Error reading file");
    callback("");
  };
  reader.readAsDataURL(file);
}

// 4a. Setup image preview
function setupImagePreview() {
  var photoInput =
    document.getElementById("photo") || document.getElementById("photoUrl");
  if (!photoInput) return;

  // Create preview container if it doesn't exist
  var previewContainer = document.getElementById("imagePreview");
  if (!previewContainer) {
    previewContainer = document.createElement("div");
    previewContainer.id = "imagePreview";
    previewContainer.className = "mt-2";
    photoInput.parentNode.appendChild(previewContainer);
  }

  // Add change event listener for file input
  if (photoInput.type === "file") {
    photoInput.addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (file) {
        handleFileUpload(photoInput, function (dataUrl) {
          if (dataUrl) {
            previewContainer.innerHTML =
              '<img src="' +
              dataUrl +
              '" alt="Preview" class="w-32 h-32 object-cover rounded border">';
          } else {
            previewContainer.innerHTML = "";
          }
        });
      } else {
        previewContainer.innerHTML = "";
      }
    });
  }
}

// 5. Init the Add‐Member (and Edit) page
function initAddMemberPage() {
  var form = document.getElementById("addMemberForm");
  if (!form) return;

  populateRelationSelects();
  setupImagePreview();

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

    // Get the photo input element
    var photoInput =
      document.getElementById("photo") || document.getElementById("photoUrl");

    // Handle file upload if it's a file input
    if (photoInput && photoInput.type === "file") {
      handleFileUpload(photoInput, function (photoDataUrl) {
        submitForm(photoDataUrl);
      });
    } else {
      // Handle text input (URL)
      var photoUrl = photoInput?.value?.trim() || "";
      submitForm(photoUrl);
    }

    function submitForm(photoUrl) {
      // Gather other values
      var fullName = document.getElementById("fullName")?.value.trim() || "";
      var age = document.getElementById("age")?.value || "";
      var category = document.getElementById("category")?.value || "";
      var spouseId = document.getElementById("spouseSelect")?.value || null;

      // Ensure spouseId is null if empty string
      if (spouseId === "") spouseId = null;

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
      window.location.href = "homepage.html";
    }
  });
}

// 5. Create a member card (updated to handle image errors and match expected parameters)
function createMemberCard(member, all, showCategory, showEditBtn) {
  var card = document.createElement("div");
  card.className = "member-card bg-white shadow rounded p-4";
  card.dataset.fullname = member.fullName;

  // Photo with error handling
  var img = document.createElement("img");
  img.className = "w-40 h-32 object-cover mb-2 rounded";
  img.alt = member.fullName;

  // Handle image loading with fallback
  img.onerror = function () {
    // Create a placeholder div if image fails to load
    var placeholder = document.createElement("div");
    placeholder.className =
      "w-40 h-32 bg-gray-200 mb-2 rounded flex items-center justify-center";
    placeholder.innerHTML =
      '<span class="text-gray-500 text-sm">No Photo</span>';
    img.parentNode.replaceChild(placeholder, img);
  };

  // Set image source - handle both string and object cases
  var photoUrl = "";
  if (typeof member.photoUrl === "string") {
    photoUrl = member.photoUrl.trim();
  } else if (
    member.photoUrl &&
    typeof member.photoUrl === "object" &&
    member.photoUrl.value
  ) {
    photoUrl = member.photoUrl.value.trim();
  }

  if (photoUrl !== "") {
    img.src = photoUrl;
  } else {
    // Use a data URL for a simple gray placeholder
    img.src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e5e7eb'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%23666' text-anchor='middle' dy='.3em'%3ENo Photo%3C/text%3E%3C/svg%3E";
  }

  card.appendChild(img);

  // Name
  var h2 = document.createElement("h2");
  h2.textContent = member.fullName;
  h2.className = "text-lg font-semibold mb-1";
  card.appendChild(h2);

  // Category (if showCategory is true)
  if (showCategory && member.category) {
    var categoryP = document.createElement("p");
    categoryP.className = "text-sm text-gray-600 mb-1";
    categoryP.innerHTML = "<strong>Category:</strong> " + member.category;
    card.appendChild(categoryP);
  }

  // Age (if available)
  if (member.age) {
    var ageP = document.createElement("p");
    ageP.className = "text-sm text-gray-600 mb-1";
    ageP.innerHTML = "<strong>Age:</strong> " + member.age;
    card.appendChild(ageP);
  }

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
        a.href = "view paternal.html";
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

  // Edit and Delete buttons (if showEditBtn is true)
  if (showEditBtn) {
    var buttonContainer = document.createElement("div");
    buttonContainer.className = "flex gap-2 mt-3";

    var editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className =
      "flex-1 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors";
    editBtn.onclick = function () {
      window.location.href = "add-member.html?id=" + member.id;
    };

    var deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className =
      "flex-1 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors";
    deleteBtn.onclick = function () {
      if (confirm("Are you sure you want to delete " + member.fullName + "?")) {
        deleteMember(member.id);
      }
    };

    buttonContainer.appendChild(editBtn);
    buttonContainer.appendChild(deleteBtn);
    card.appendChild(buttonContainer);
  }

  return card;
}

// 6. Init the Maternal page (FIXED - no more infinite loop!)
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
    if (
      all[j].spouseId &&
      matIds.indexOf(all[j].spouseId) > -1 &&
      matIds.indexOf(all[j].id) === -1
    ) {
      matIds.push(all[j].id);
    }
  }

  // 4) render - FIXED: use matIds instead of undefined 'unique'
  grid.innerHTML = "";
  for (var m = 0; m < all.length; m++) {
    if (matIds.indexOf(all[m].id) > -1) {
      grid.appendChild(createMemberCard(all[m], all, false, false));
    }
  }
}

// Additional utility function to clean up data
function cleanupMemberData() {
  var members = loadMembers();
  var hasChanges = false;

  for (var i = 0; i < members.length; i++) {
    var member = members[i];

    // Fix photoUrl if it's an object or contains fakepath
    if (typeof member.photoUrl === "object") {
      member.photoUrl = "";
      hasChanges = true;
    } else if (
      typeof member.photoUrl === "string" &&
      member.photoUrl.includes("fakepath")
    ) {
      member.photoUrl = "";
      hasChanges = true;
    }

    // Ensure childrenIds exists as array
    if (!member.childrenIds || !Array.isArray(member.childrenIds)) {
      member.childrenIds = [];
      hasChanges = true;
    }

    // Clean up invalid spouse relationships
    if (member.spouseId) {
      var spouseExists = members.find(function (m) {
        return m.id === member.spouseId;
      });
      if (!spouseExists) {
        member.spouseId = null;
        hasChanges = true;
      }
    }
  }

  if (hasChanges) {
    saveMembers(members);
    console.log(
      "Data cleanup completed - removed fakepath URLs and fixed data structure"
    );
  }
}
// 7. Wire it all up when the page loads
document.addEventListener("DOMContentLoaded", function () {
  // Clean up any corrupted data first
  cleanupMemberData();

  initAddMemberPage();
  initMaternalPage();
  // home.js will handle the home page tree
});
