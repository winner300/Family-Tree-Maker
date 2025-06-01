document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("custom-grid");
  if (!grid) return;

  const members = loadMembers().filter((m) => m.category === "Custom");
  grid.innerHTML = "";
  members.forEach((member) => {
    const card = createMemberCard(member, members);
    grid.appendChild(card);
  });
});
