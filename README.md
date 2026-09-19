# Examen DeliverUS - Modelo Cupones - Gestión de Cupones por Clientes

## Enunciado del examen

Hasta ahora DeliverUS contaba con dos tipos de usuario: **customer** (cliente, que realiza pedidos) y **owner** (propietario, que gestiona sus restaurantes y confirma/envía/entrega los pedidos). En esta convocatoria se incorpora a la aplicación de cliente (`DeliverUS-Frontend-Customer`) la **gestión de cupones de descuento**.

### ¿Qué es un cupón y qué puede hacer el customer?

Un cupón es un código de descuento que el cliente puede aplicar a uno de sus pedidos **pendientes**. Cada cupón tiene un porcentaje de descuento, un importe mínimo de pedido, una fecha de caducidad y un número máximo de usos.

De forma resumida, un customer puede:

1. **Registrarse e identificarse** (`POST /users/register`, `POST /users/login`). *Esta parte ya está implementada.*
2. **Consultar los cupones disponibles**: aquellos que no han caducado y a los que todavía les quedan usos. *Esta parte ya está implementada.*
3. **Aplicar un cupón a uno de sus pedidos pendientes**: el pedido queda asociado al cupón y su precio se reduce con el descuento del cupón. A partir de ese momento el cupón deja de estar disponible para ese pedido.
4. **Consultar sus pedidos**, para hacer seguimiento de los que aún no se han entregado y de los ya entregados, y ver el cupón aplicado a cada uno.
5. **Quitar el cupón** de un pedido pendiente, restaurando su precio original y liberando el uso del cupón.
6. **Añadir indicaciones de entrega**: una nota sobre cómo entregar el pedido (p. ej. "Dejar en la puerta, no contestan al timbre").

> ⚠️ **Un cupón solo puede aplicarse o quitarse mientras el pedido está pendiente** (es decir, antes de que el restaurante lo confirme). Los pedidos ya confirmados no pueden modificar su importe.

### Modelado conceptual

Diagrama de clases de referencia de DeliverUS incluyendo la entidad `Coupon` y su relación con `Order` (a modelar por el alumnado).

![Diagrama de clases de DeliverUS](images/CouponClassDiagram.svg)

### Modelo de datos del cupón

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | INTEGER | Clave primaria. |
| `code` | STRING | Código único del cupón (p. ej. `WELCOME10`). |
| `description` | STRING | Descripción del cupón. |
| `discountPercentage` | INTEGER | Porcentaje de descuento (1-100). |
| `minPrice` | DOUBLE | Importe mínimo del pedido para poder aplicarlo. |
| `expiresAt` | DATE | Fecha y hora de caducidad. |
| `maxUses` | INTEGER | Número máximo de usos. |
| `usedCount` | INTEGER | Número de usos ya realizados. |

Cambios a realizar sobre el pedido (`Order`): `couponId` (clave foránea a `Coupon`), `couponDiscount` (importe descontado) y `customerComments` (texto con las indicaciones de entrega).

### El cupón en el ciclo de vida del pedido

El ciclo de vida del pedido sigue siendo `pending → confirmado (startedAt) → enviado (sentAt) → entregado (deliveredAt)`, gestionado por el owner mediante `confirm`/`send`/`deliver`. El cupón se aplica **solo** `pending` (sin `startedAt`) y, al aplicarlo, el nuevo precio del pedido se calcula como:

```
couponDiscount = round(price * discountPercentage / 100, 2)
price = price - couponDiscount
```

Al quitar el cupón, el precio vuelve a su valor original (`price + couponDiscount`) y `couponId` y `couponDiscount` quedan a `null`.

Es necesaria la implementación de los siguientes requisitos funcionales:

> Las pruebas de aceptación de cada RF se dividen en **Backend** (que se ayudan a verificar con `coupons.test.js`, que no debe modificarse) y **Frontend** (comportamiento que debe observarse al usar la aplicación: navegación tras una acción y mensajes de éxito/error).

### **RF1. Consultar cupones disponibles**. **YA IMPLEMENTADO**

**Como** customer,

**quiero** ver la lista de cupones vigentes a los que todavía les quedan usos

**para** poder elegir cuál aplicar a mi pedido.

**Pruebas de aceptación — Backend** (`GET /coupons/available`):

- Sin sesión iniciada: `401 Unauthorized`.
- Con sesión iniciada como `owner`: `403 Forbidden`.
- Con sesión iniciada como `customer`: `200 OK` y un array de cupones.
- Un cupón caducado (`expiresAt` en el pasado) no debe aparecer en el listado.
- Un cupón sin usos disponibles (`usedCount` mayor o igual que `maxUses`) tampoco debe aparecer en el listado.

**Pruebas de aceptación — Frontend** (`AvailableCouponsScreen.js`, ya implementada, para referencia):

- Al entrar en la pestaña "Available coupons" se carga el listado automáticamente.
- Si la petición falla, se muestra un mensaje de error y se conserva el listado previo.

### **RF2. Aplicar un cupón**

**Como** customer,

**quiero** aplicar un cupón a uno de mis pedidos pendientes

**para** pagar menos por ese pedido.

**Pruebas de aceptación — Backend** (`PATCH /orders/:orderId/applyCoupon`):

- Sin sesión iniciada: `401 Unauthorized`.
- Con sesión iniciada como `owner`: `403 Forbidden`.
- Pedido que no pertenece al customer autenticado: `403 Forbidden`.
- Pedido inexistente: `404 Not Found`.
- `code` ausente o vacío en el cuerpo de la petición: `422 Unprocessable Entity`.
- Cupón inexistente: `404 Not Found`.
- Pedido que no está pendiente (ya tiene `startedAt`): `409 Conflict`.
- Pedido que ya tiene un cupón aplicado: `409 Conflict`.
- Pedido cuyo `price` es inferior al `minPrice` del cupón: `409 Conflict`.
- Cupón caducado: `409 Conflict`.
- Cupón sin usos disponibles: `409 Conflict`.
- Éxito: `200 OK`, y el pedido devuelto tiene `couponId` igual al id del cupón, `couponDiscount` igual al importe descontado, `price` reducido en ese importe y el `usedCount` del cupón incrementado en 1.

**Pruebas de aceptación — Frontend** (pantalla `EditOrderScreen`, **Ejercicio 5**):

- La pantalla dispone de un formulario con el código del cupón.
- Al aplicarlo con éxito: se muestra un mensaje de éxito y se refresca el pedido mostrado, de forma que el nuevo precio y el descuento quedan visibles.
- Si la aplicación falla (código inválido, cupón no aplicable, etc.): se muestra un mensaje de error y se permanece en la pantalla.

### **RF3. Consultar mis pedidos**

**Como** customer,

**quiero** ver el listado de los pedidos que he realizado

**para** hacer seguimiento de los que aún no se han entregado y de los ya entregados, y acceder fácilmente a los pedidos sobre los que puedo actuar.

**Pruebas de aceptación — Backend** (`GET /orders/customer`):

- Sin sesión iniciada: `401 Unauthorized`.
- Con sesión iniciada como `owner`: `403 Forbidden`.
- Con sesión iniciada como `customer`: `200 OK` y un array de pedidos.
- El listado solo debe incluir pedidos cuyo `userId` sea el del customer autenticado (nunca pedidos de otros clientes).
- Los pedidos pendientes de entregar (`deliveredAt` es `null`) deben listarse antes que los ya entregados.

**Pruebas de aceptación — Frontend** (pantalla "My Orders", **Ejercicio 4**):

- Cada pedido se muestra con el logo del restaurante, el id del pedido, el nombre del restaurante, la dirección de entrega y el precio.
- Si el pedido tiene un cupón aplicado, se muestra su código y/o el descuento aplicado.
- Al pulsar sobre el `ImageCard` de cada pedido se navega a la pantalla `EditOrderScreen`.
- El listado se recarga al volver desde la pantalla `EditOrderScreen`, no solo la primera vez que se monta la pantalla.
- Si el customer no tiene pedidos, se muestra un mensaje indicándolo en lugar de una lista vacía.
- Si la petición falla, se muestra un mensaje de error.

### **RF4. Quitar un cupón**

**Como** customer,

**quiero** quitar el cupón de un pedido pendiente

**para** dejar de aplicar un descuento que ya no quiero usar.

**Pruebas de aceptación — Backend** (`PATCH /orders/:orderId/removeCoupon`):

- Sin sesión iniciada: `401 Unauthorized`.
- Con sesión iniciada como `owner`: `403 Forbidden`.
- Pedido que no pertenece al customer autenticado: `403 Forbidden`.
- Pedido inexistente: `404 Not Found`.
- Pedido que no está pendiente (ya tiene `startedAt`): `409 Conflict`.
- Pedido que no tiene ningún cupón aplicado: `409 Conflict`.
- Éxito: `200 OK`, con `couponId` y `couponDiscount` a `null`, el `price` restaurado a su valor original y el `usedCount` del cupón decrementado en 1.

**Pruebas de aceptación — Frontend** (pantalla "My Orders", **Ejercicio 4**):

- Un pedido pendiente con cupón muestra el botón "Remove coupon" (color `brandGreen`).
- Al pulsarlo con éxito: se muestra un mensaje de éxito y se refresca el listado **en la misma pantalla**; el pedido actualizado deja de mostrar el descuento y el botón.
- Si la acción falla: se muestra un mensaje de error y el listado no se modifica.

### **RF5. Añadir indicaciones de entrega**

**Como** customer,

**quiero** añadir o editar una nota sobre la entrega de uno de mis pedidos

**para** indicar al repartidor cómo entregarlo (p. ej. dónde dejarlo).

**Pruebas de aceptación — Backend** (`PATCH /orders/:orderId/customerComments`):

- Sin sesión iniciada: `401 Unauthorized`.
- Con sesión iniciada como `owner`: `403 Forbidden`.
- Pedido que no pertenece al customer autenticado: `403 Forbidden`.
- Pedido inexistente: `404 Not Found`.
- `customerComments` supera los 500 caracteres: `422 Unprocessable Entity`.
- `customerComments` vacío, `null` o ausente: válido, `200 OK` (el comentario es opcional).
- Éxito: `200 OK`, con el pedido devuelto reflejando el nuevo `customerComments`.

**Pruebas de aceptación — Frontend** (pantalla `EditOrderScreen`, **Ejercicio 5**):

- Se accede a esta pantalla pulsando sobre la tarjeta de un pedido en el listado "My Orders".
- El formulario de indicaciones se inicializa con el comentario ya guardado del pedido (o vacío si no tenía).
- Si el usuario escribe más de 500 caracteres, la aplicación de frontend debe mostrar un error de validación **antes** de enviar la petición, y el botón de guardar no debe completar el envío. En cualquier caso, la aplicación de backend también debe asegurar que el comentario no supera los 500 caracteres y mostrar los errores enviados por el backend.
- Al guardar con éxito: se muestra un mensaje de éxito y se navega de vuelta al listado "My Orders" (`MyOrdersScreen`).
- Si guardar falla (p. ej. error del servidor o de conexión): se muestra un mensaje de error y se permanece en el formulario, sin perder lo escrito.

---

## Parte Backend

### Ejercicios (Backend)

#### 1. Migraciones y Modelos (1 puntos)

Realice las modificaciones necesarias en migraciones y modelos para implementar la asociación entre pedidos y cupones, y las indicaciones de entrega:

- Añada a `Order` las columnas `couponId` (clave foránea a `Coupons`), `couponDiscount` y `customerComments`.
- Añada la asociación `Order.belongsTo(Coupon)` (con alias `coupon`).

Recuerde modificar tanto la migración `create-order` como el modelo `Order.js`.

#### 2. Enrutamiento, Middlewares y Validación (2 puntos)

En `src/routes/OrderRoutes.js` añada las rutas nuevas para implementar los siguientes requisitos funcionales:

- **RF2. Aplicar un cupón**
- **RF3. Consultar mis pedidos**
- **RF4. Quitar un cupón**
- **RF5. Añadir indicaciones de entrega**

En `src/middlewares/OrderMiddleware.js`, implemente los siguientes middlewares nuevos:

- `checkOrderBelongsToCustomer` para comprobar que el pedido pertenece al customer autenticado (usado en el **RF2**, **RF4** y **RF5**).
- `checkOrderCanBeCouponApplied` para cumplir el **RF2. Aplicar un cupón** (pedido pendiente, sin cupón previo, cupón existente, no caducado, con usos disponibles e importe mínimo alcanzado).
- `checkOrderCanRemoveCoupon` para cumplir el **RF4. Quitar un cupón** (pedido pendiente y con cupón aplicado).

En `src/controllers/validation/OrderValidation.js`, añada las reglas de validación:

- `applyCoupon` necesarias para cumplir **RF2** (el `code` es obligatorio).
- `updateCustomerComments` necesarias para cumplir **RF5**.

> Los middlewares `checkOrderVisible`, `checkOrderIsPending`, `checkOrderCanBeSent`, `checkOrderCanBeDelivered` y `checkOrderOwnership`, así como `handleValidation`, ya están implementados y puede tomarlos como referencia en caso necesario.

> Como referencia de orden de rutas, `PATCH /orders/:orderId/applyCoupon` pasa por: `isLoggedIn`, `hasRole('customer')`, `checkEntityExists(Order, 'orderId')`, `checkOrderBelongsToCustomer`, las reglas de validación `applyCoupon`, `handleValidation`, `checkOrderCanBeCouponApplied` y, por último, el controlador.

> Tenga en cuenta que `GET /orders/customer` debe registrarse **antes** que `GET /orders/:orderId`, para que Express no interprete `customer` como un `orderId`.

#### 3. Controladores (2 puntos)

En `src/controllers/OrderController.js`:

- Implemente `applyCoupon` para cumplir con **RF2. Aplicar un cupón**.
- Implemente `indexCustomer` para cumplir con **RF3. Consultar mis pedidos** (actualmente devuelve `500`).
- Implemente `removeCoupon` para cumplir con **RF4. Quitar un cupón**.
- Implemente `updateCustomerComments` para cumplir con **RF5. Añadir indicaciones de entrega**.

---

### Código Proporcionado (Backend)

Para este examen, se le entrega ya implementado:

1. Registro y login de clientes (`registerCustomer`/`loginCustomer`, en `UserController.js` y `UserRoutes.js`).
2. El modelo `Coupon` (`src/models/Coupon.js`), su migración (`create-coupon`) y su seeder, incluyendo cupones de ejemplo (`WELCOME10`, `SUMMER20`, `LASTONE`).
3. El controlador `findAvailableCoupons` y la ruta `GET /coupons/available` (**RF1. Consultar cupones disponibles**).
4. La comprobación de que un customer puede ver el detalle de sus propios pedidos (`checkOrderCustomer`, en `OrderMiddleware.js`).
5. Los controladores `confirm`, `send`, `deliver` y `show`, que podría reutilizar en caso necesario.
6. El seeder de usuarios ya incluye un customer de pruebas: `customer1@customer.com` / `secret`.

---

## Parte Frontend (aplicación Customer)

Implemente las pantallas necesarias en `DeliverUS-Frontend-Customer` para que un customer pueda usar la aplicación.
**NOTA: solo se valorará aquello que pueda ser utilizado tal y como lo haría un usuario final. No se valorarán pantallas que no renderizan o funcionalidades que no puedan probarse desde la interfaz**

### Ejercicios (Frontend)

#### 4. Pantalla de listado "My Orders" (2 puntos)

**Pantalla**: `src/screens/customerOrders/MyOrdersScreen.js`

Implemente esta pantalla para cumplir con **RF3. Consultar mis pedidos** y **RF4. Quitar un cupón**. Use el componente `ImageCard` para cada pedido. Puede utilizar `AvailableCouponsScreen.js` como inspiración.

**API Backend necesaria** (añada las funciones que falten en `src/api/OrderEndpoints.js`):

- `GET /orders/customer`
- `PATCH /orders/:orderId/removeCoupon`

#### 5. Pantalla de detalle y cupón del pedido (2 puntos)

**Pantalla**: `src/screens/customerOrders/EditOrderScreen.js`

Ya dispone de una versión de esta pantalla donde se muestra una cabecera con datos del restaurante y del pedido, y el listado de productos. Añada dos formularios con `Formik` y un esquema de validación de `yup`:

- un formulario para **aplicar un cupón** (**RF2**) con el código del cupón, y
- un formulario para **añadir las indicaciones de entrega** (**RF5**),

mostrando eventuales errores de validación enviados desde backend. Registre también esta pantalla en `CustomerOrdersStack.js` para que sea alcanzable desde `MyOrdersScreen` al pulsar sobre un pedido.

**API Backend necesaria** (añada las funciones que falten en `src/api/OrderEndpoints.js`):

- `PATCH /orders/:orderId/applyCoupon`
- `PATCH /orders/:orderId/customerComments`

#### Fidelidad estética (1 punto)

Se valorará el grado de similitud visual de las interfaces entregadas con respecto a las pantallas ya existentes de la propia aplicación.

Para ello, tenga también en cuenta lo siguiente:

- Use los colores corporativos definidos en `src/styles/GlobalStyles.js` (`brandBlue`/`brandBlueTap`, `brandGreen`/`brandGreenTap`, `brandPrimary`) y los iconos de `MaterialCommunityIcons` (paquete `@expo/vector-icons`) ya usados en el resto de la aplicación, manteniendo un estilo consistente con las pantallas ya existentes (`AvailableCouponsScreen.js`, `EditOrderScreen.js`).
- Los iconos concretos de `MaterialCommunityIcons` a utilizar son:

| Icono | Dónde |
| --- | --- |
| `ticket-percent` | Botón "Apply coupon" (Ejercicio 5). |
| `map-marker` | Dirección de entrega del pedido, en cada tarjeta de pedido (Ejercicio 4) y en la cabecera del pedido (Ejercicio 5). |
| `cash` | Precio del pedido, en cada tarjeta de pedido (Ejercicio 4) y en la cabecera del pedido (Ejercicio 5). |
| `comment-text` | Botón "Save comments" (Ejercicio 5). |

### Código Proporcionado (Frontend Customer)

Para este examen, se le entrega ya implementado:

1. Registro, login y perfil del customer (`LoginScreen.js`, `RegisterScreen.js`, `ProfileScreen.js` y su navegación).
2. La pantalla de cupones disponibles (`AvailableCouponsScreen.js`).
3. Las funciones ya existentes en `src/api/CouponEndpoints.js` (`getAvailableCoupons`) y en `src/api/OrderEndpoints.js` (`getOrderDetail`).
4. La estructura base (cabecera con datos del restaurante y listado de productos) de `EditOrderScreen.js`, a la que solo debe añadir los formularios.
5. El componente `InputItem`, ya preparado para integrarse con Formik.

---

## Formato de petición/respuesta

Los códigos de estado y las reglas de negocio de cada endpoint están descritos en la RF correspondiente. Aquí solo se detalla la forma de los datos que no resulte obvia a partir de las RFs.

### PATCH /orders/:orderId/applyCoupon (RF2)

**Request**:

```json
{
  "code": "WELCOME10"
}
```

### PATCH /orders/:orderId/customerComments (RF5)

**Request**:

```json
{
  "customerComments": "Dejado en la puerta, no contestan al timbre"
}
```

---

## Procedimiento de entrega

1. Borrar la carpeta **node_modules** de backend y de ambos frontend.
2. Crear un ZIP que incluya todo el proyecto. **Importante: Comprueba que el ZIP no es el mismo que te has descargado e incluye tu solución**
3. Avisa al profesor antes de entregar.
4. Cuando el profesor te dé el visto bueno, puedes subir el ZIP a la plataforma de Enseñanza Virtual. **Es muy importante esperar a que la plataforma te muestre un enlace al ZIP antes de pulsar el botón de enviar**. Se recomienda descargar ese ZIP para comprobar lo que se ha subido. Un vez realizada la comprobación, puedes enviar el examen.

## Preparación del entorno

### a) Windows

- Abra un terminal y ejecute el comando `npm run install:all:win`.

### b) Linux/MacOS

- Abra un terminal y ejecute el comando `npm run install:all:bash`.

## Ejecución

### 1. Backend

- Para **rehacer las migraciones y seeders**, abra un terminal y ejecute el comando

    ```Bash
    npm run migrate:backend
    ```

- Para **ejecutarlo**, abra un terminal y ejecute el comando

    ```Bash
    npm run start:backend
    ```

### 2. Frontend Customer

- Con el backend en ejecución, abra otro terminal y ejecute el comando

    ```Bash
    npm run start:frontend:customer
    ```

- Puede iniciar sesión con el usuario de pruebas `customer1@customer.com` / `secret`, o registrar un customer nuevo desde la propia aplicación.

## Depuración

- Para **depurar el backend**, asegúrese de que **NO** existe una instancia en ejecución, pulse en el botón `Run and Debug` de la barra lateral, seleccione `Debug Backend` en la lista desplegable, y pulse el botón de *Play*.

## Test

- Como ayuda puede ejecutar el conjunto de tests incluido `coupons.test.js`, que cubre el registro/login de customers, los cupones disponibles, la aplicación y retirada de cupones, el listado propio de pedidos y las indicaciones de entrega. Para ello ejecute el siguiente comando:

    ```Bash
    npm run test:backend
    ```

**Advertencia: Los tests no pueden ser modificados.**
