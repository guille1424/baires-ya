# 📄 Documento de Diseño Técnico: StockManager PWA

**Proyecto:** StockManager (Gestión de Stock Comercial)
**Versión:** 1.0.0
**Tipo de Aplicación:** Progressive Web App (PWA)
**Rol:** Arquitecto de Software
**Fecha:** 16/12/2025

---

## 1. Resumen Ejecutivo

Desarrollo de una aplicación móvil multiplataforma (Android/iOS/Desktop) utilizando tecnología PWA. La aplicación está destinada exclusivamente al dueño de una tienda de ropa para gestionar inventario, ventas y métricas de negocio de manera privada, eficiente y sin dependencia de tiendas de aplicaciones.

## 2. Stack Tecnológico (MERN + TypeScript)

Se ha seleccionado una arquitectura moderna, escalable y de bajo costo de mantenimiento.

### 📱 Frontend (Cliente PWA)

- **Core:** React 18 (Vite)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS (Utility-first, Dark Mode nativo)
- **PWA Engine:** `vite-plugin-pwa` (Service Workers, Manifest, Instalabilidad)
- **Estado Global:** Zustand
- **Manejo de Datos (Excel):** SheetJS (`xlsx`)
- **Escaneo:** `html5-qrcode` (Escaneo vía cámara web/móvil)
- **Iconos:** Lucide React

### 🌐 Backend (API REST)

- **Runtime:** Node.js
- **Framework:** Express.js
- **Validaciones:** Zod
- **Carga de Archivos:** Multer
- **Autenticación:** JSON Web Tokens (JWT) + bcrypt

### 🗄️ Base de Datos

- **Motor:** MongoDB (Atlas o Local)

## StockManager — Especificación optimizada (versión inicial)

Propósito: aplicación PWA privada para el/la dueño/a de una tienda de ropa que gestiona inventario, ventas y métricas desde móvil o escritorio.

Alcance MVP (prioridad):

- Gestión de productos (crear, editar, listar, eliminar).
- Registro de ventas con actualización de stock atómica.
- Importación masiva desde Excel (.xlsx).
- Escáner de código de barras para agregar al carrito.
- Dashboard con métricas clave y alertas de stock bajo.

Recomendación técnica para MVP:

- Backend: Node.js + Express + TypeScript. Para desarrollo inicial usar SQLite (fácil de iniciar y migrar luego a MongoDB si se requiere). Validaciones con Zod. Autenticación con JWT.
- Frontend: React + Vite + TypeScript + Tailwind. PWA con `vite-plugin-pwa`. Escáner con `html5-qrcode` y import Excel con `xlsx`.

Modelos (MVP) — campos esenciales:

- Product: id, barcode (unique), name, category, type, design?, color, size, price, stock, createdAt, updatedAt, deletedAt?
- Sale: id, date, totalAmount, items[{ productId, barcode, name, quantity, priceAtSale }]
- User: id, username (unique), passwordHash, createdAt
- Attribute: id, type (category/size/color/design), value

Reglas clave:

- Importación Excel: si barcode existe → sumar stock; si no → crear producto; generar `Attribute` nuevos.
- Venta: decrementar stock y crear registro de venta de forma atómica (transacción DB).
- Eliminación: preferir eliminación lógica (`deletedAt`) para auditoría.

API (endpoints esenciales):

- Auth
  - POST /api/auth/login { username, password } → { token }
  - POST /api/auth/register { username, password } → (provisioning inicial)
- Products
  - GET /api/products?search=&page=&category=
  - GET /api/products/:barcode
  - POST /api/products
  - PUT /api/products/:id
  - DELETE /api/products/:id
  - POST /api/products/import (multipart .xlsx)
- Sales
  - POST /api/sales { items: [{ barcode, qty }] } → crea venta y decrementa stock
- Stats
  - GET /api/stats/summary → { totalInventoryValue, totalItems, lowStock: [] }

UI (pantallas principales):

- Login
- Dashboard (métricas + acceso a escanear)
- Escanear / Venta rápida
- Inventario (lista, búsqueda, filtros) + detalle/edición de producto
- Importar (subir .xlsx) y ver resultados
- Ajustes (atributos, backup/export)

Roadmap técnico (fases):

1. Scaffold repo (backend TS + frontend Vite). 2) Backend core: modelos, auth, CRUD products. 3) Import Excel y tests. 4) Frontend básico y PWA. 5) Escáner y flujo de venta. 6) Dashboard y mejoras. 7) Deploy.

Próximos pasos que puedo ejecutar ahora:

- Inicializar scaffold del backend TypeScript con Express y esquema SQLite local.
- Implementar endpoints `auth` y `products` (CRUD) básicos.

Si confirmas, empiezo creando el scaffold del backend y los archivos base.
