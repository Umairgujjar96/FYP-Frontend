export function processCommand(text) {
  text = text.toLowerCase();

  if (text.includes("add product")) {
    const productName = text.replace("add product", "").trim();
    addProduct(productName);
  } else if (text.includes("delete product")) {
    const productName = text.replace("delete product", "").trim();
    deleteProduct(productName);
  } else if (text.includes("update price of")) {
    const match = text.match(/update price of (.*?) to (\d+)/);
    if (match) {
      const productName = match[1];
      const newPrice = match[2];
      updateProductPrice(productName, newPrice);
    }
  } else if (text.includes("show all products")) {
    fetchProducts();
  } else {
    console.log("Unknown command");
  }
}

async function addProduct(name) {
  await fetch("/api/products", {
    method: "POST",
    body: JSON.stringify({ name }),
    headers: { "Content-Type": "application/json" },
  });
}

async function deleteProduct(name) {
  await fetch(`/api/products/${name}`, { method: "DELETE" });
}

async function updateProductPrice(name, price) {
  await fetch(`/api/products/${name}`, {
    method: "PUT",
    body: JSON.stringify({ price }),
    headers: { "Content-Type": "application/json" },
  });
}

async function fetchProducts() {
  const response = await fetch("/api/products");
  const data = await response.json();
  console.log(data);
}
