# Ejercicio de repaso — Pantalla "Restaurant reviews"

## Funcionalidad a implementar

### Pantalla nueva: `RestaurantReviewsScreen`

Desde la pantalla **My Orders**, cada pedido mostrará un botón llamado **Restaurant reviews**. Al pulsarlo se abrirá una pantalla nueva con todas las reseñas del restaurante de ese pedido.

La pantalla debe mostrar:

1. Una cabecera con:
   - logo del restaurante;
   - nombre del restaurante;
   - puntuación media del restaurante;
   - número total de reseñas.
2. Un listado de reseñas, de la más reciente a la más antigua, donde cada reseña muestre:
   - avatar del cliente que la escribió (o avatar por defecto);
   - nombre del cliente;
   - fecha de la reseña;
   - puntuación en estrellas;
   - comentario, o el texto `No comment` si la reseña no tiene comentario.
3. Un mensaje indicando que no hay reseñas si el listado está vacío.
4. Un mensaje de error si la petición falla, conservando el listado anterior si ya había datos.

La pantalla **no** permite crear, editar ni eliminar reseñas. Es una pantalla de consulta pública.

---

## Backend proporcionado

El endpoint necesario **ya está implementado** en el proyecto. No tienes que modificarlo.

### `GET /restaurants/:restaurantId/reviews`

Devuelve todas las reseñas de un restaurante, ordenadas de la más reciente a la más antigua.

- No requiere autenticación.
- Si el restaurante no existe: `404 Not Found`.
- Si el restaurante existe: `200 OK` y un array de reseñas.

Ejemplo de respuesta:

```json
[
  {
    "id": 1,
    "rating": 5,
    "comment": "Comida excelente y entrega muy rápida",
    "orderId": 1,
    "restaurantId": 1,
    "userId": 1,
    "createdAt": "2026-10-21T15:47:21.000Z",
    "updatedAt": "2026-10-21T15:47:21.000Z",
    "user": {
      "id": 1,
      "firstName": "Customer 1",
      "avatar": "public/avatars/maleAvatar.png"
    }
  }
]
```

> El seeder ya incluye reseñas para los restaurantes `1` y `2`, así que puedes probar la pantalla iniciando sesión con `customer1@customer.com` / `secret`.

---

## Archivos que debes crear o modificar

| Acción | Archivo |
| --- | --- |
| Crear | `DeliverUS-Frontend-Customer/src/screens/customerOrders/RestaurantReviewsScreen.js` |
| Modificar | `DeliverUS-Frontend-Customer/src/api/ReviewEndpoints.js` |
| Modificar | `DeliverUS-Frontend-Customer/src/screens/customerOrders/CustomerOrdersStack.js` |
| Modificar | `DeliverUS-Frontend-Customer/src/screens/customerOrders/MyOrdersScreen.js` |

No se permite añadir dependencias nuevas. Usa los componentes y colores que ya existen en el proyecto.

---

## Requisitos detallados

### 1. API helper

Añade en `ReviewEndpoints.js` una función y expórtala junto al resto de funciones.

### 2. Pantalla `RestaurantReviewsScreen`

- Debe recibir el restaurante mediante `route.params.restaurant`.
- Debe cargar las reseñas automáticamente al entrar en la pantalla.
- Debe usar `useFocusEffect` para volver a cargar las reseñas cuando la pantalla vuelva a estar visible.
- Debe usar una `FlatList`.
- La cabecera del listado se implementará con `ListHeaderComponent`.
- El estado vacío se implementará con `ListEmptyComponent`.
- La puntuación media se calculará en el cliente a partir del array de reseñas.
- Si no hay reseñas, la media no debe mostrar `NaN`; debe mostrar un texto como `No reviews yet`.
- El avatar del cliente debe construirse con `API_BASE_URL` cuando exista, y usar `assets/maleAvatar.png` como imagen por defecto.
- El logo del restaurante debe construirse con `API_BASE_URL` cuando exista, y usar `assets/restaurantLogo.jpeg` como imagen por defecto.
- Si la petición falla, se debe mostrar un mensaje con `showMessage` y no se debe vaciar el listado que ya estuviera cargado.

### 3. Navegación desde `MyOrdersScreen`

Añade en cada tarjeta de pedido un botón **Restaurant reviews** que:

- use el color `GlobalStyles.brandBlue` y `GlobalStyles.brandBlueTap` al pulsarlo;
- use el icono `comment-text` de `MaterialCommunityIcons`;
- navegue a `RestaurantReviewsScreen` pasando el restaurante del pedido:

```js
navigation.navigate('RestaurantReviewsScreen', {
  restaurant: item.restaurant
})
```

### 4. Registro en el stack

Registra la pantalla nueva en `CustomerOrdersStack.js` con el nombre `RestaurantReviewsScreen` y el título `Restaurant reviews`.

---

## Pruebas de aceptación

### Backend

- `GET /restaurants/1/reviews` devuelve `200 OK` y un array.
- `GET /restaurants/99999/reviews` devuelve `404 Not Found`.
- Las reseñas vienen ordenadas de la más reciente a la más antigua.
- Cada reseña incluye `user.firstName` y `user.avatar`.

### Frontend

- En **My Orders** aparece el botón **Restaurant reviews** en cada pedido.
- Al pulsarlo se abre la pantalla nueva con el nombre y el logo del restaurante correcto.
- La pantalla muestra la media y el número de reseñas.
- Cada reseña muestra avatar, nombre, fecha, estrellas y comentario.
- Si una reseña no tiene comentario, se muestra `No comment`.
- Si el restaurante no tiene reseñas, se muestra el mensaje de listado vacío.
- Si la petición falla, se muestra un mensaje de error y se conserva el listado anterior.
- Al volver a entrar en la pantalla, los datos se vuelven a pedir al backend.
- La pantalla mantiene el estilo visual del resto de la aplicación.
