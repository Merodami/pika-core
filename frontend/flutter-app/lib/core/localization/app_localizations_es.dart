import 'app_localizations.dart';

class AppLocalizationsEs extends AppLocalizations {
  AppLocalizationsEs([String locale = 'es']) : super(locale);

  @override
  String get appName => 'Pika';

  // Common
  @override
  String get yes => 'Sí';
  @override
  String get no => 'No';
  @override
  String get ok => 'OK';
  @override
  String get cancel => 'Cancelar';
  @override
  String get save => 'Guardar';
  @override
  String get delete => 'Eliminar';
  @override
  String get edit => 'Editar';
  @override
  String get search => 'Buscar';
  @override
  String get filter => 'Filtrar';
  @override
  String get sort => 'Ordenar';
  @override
  String get loading => 'Cargando...';
  @override
  String get error => 'Error';
  @override
  String get success => 'Éxito';
  @override
  String get retry => 'Reintentar';
  @override
  String get noResults => 'Sin resultados';
  @override
  String get seeAll => 'Ver todo';
  @override
  String get seeMore => 'Ver más';
  @override
  String get seeLess => 'Ver menos';

  // Auth
  @override
  String get login => 'Iniciar sesión';
  @override
  String get logout => 'Cerrar sesión';
  @override
  String get register => 'Registrarse';
  @override
  String get forgotPassword => '¿Olvidaste tu contraseña?';
  @override
  String get email => 'Correo electrónico';
  @override
  String get password => 'Contraseña';
  @override
  String get confirmPassword => 'Confirmar contraseña';
  @override
  String get firstName => 'Nombre';
  @override
  String get lastName => 'Apellido';
  @override
  String get phone => 'Teléfono';
  @override
  String get role => 'Rol';
  @override
  String get customer => 'Cliente';
  @override
  String get serviceProvider => 'Proveedor de servicios';
  @override
  String get alreadyHaveAccount => '¿Ya tienes una cuenta?';
  @override
  String get dontHaveAccount => '¿No tienes una cuenta?';
  @override
  String get loginSuccess => 'Inicio de sesión exitoso';
  @override
  String get registerSuccess => 'Registro exitoso';
  @override
  String get invalidEmail => 'Correo electrónico inválido';
  @override
  String get passwordTooShort => 'La contraseña es muy corta';
  @override
  String get passwordsDontMatch => 'Las contraseñas no coinciden';
  @override
  String get fieldRequired => 'Este campo es obligatorio';
  
  // Additional auth fields (non-abstract methods)
  String get rememberMe => 'Recordarme';
  String get or => 'O';

  // Navigation
  @override
  String get home => 'Inicio';
  @override
  String get categories => 'Categorías';
  @override
  String get services => 'Servicios';
  @override
  String get chat => 'Chat';
  @override
  String get profile => 'Perfil';
  @override
  String get notifications => 'Notificaciones';

  // Home
  @override
  String get welcome => 'Bienvenido';
  @override
  String get popularCategories => 'Categorías populares';
  @override
  String get featuredServices => 'Servicios destacados';
  @override
  String get nearbyProviders => 'Proveedores cercanos';

  // Categories
  @override
  String get allCategories => 'Todas las categorías';
  @override
  String get selectCategory => 'Seleccionar categoría';
  @override
  String get noCategories => 'No hay categorías disponibles';

  // Services
  @override
  String get allServices => 'Todos los servicios';
  @override
  String get createService => 'Crear servicio';
  @override
  String get serviceDetails => 'Detalles del servicio';
  @override
  String get bookService => 'Reservar servicio';
  @override
  String get serviceBooked => 'Servicio reservado';
  @override
  String get price => 'Precio';
  @override
  String get duration => 'Duración';
  @override
  String get description => 'Descripción';
  @override
  String get availability => 'Disponibilidad';
  @override
  String get reviews => 'Reseñas';
  @override
  String get rating => 'Calificación';
  @override
  String get noServices => 'No hay servicios disponibles';

  // Chat
  @override
  String get conversations => 'Conversaciones';
  @override
  String get newMessage => 'Nuevo mensaje';
  @override
  String get typeMessage => 'Escribe un mensaje...';
  @override
  String get send => 'Enviar';
  @override
  String get online => 'En línea';
  @override
  String get offline => 'Desconectado';
  @override
  String get typing => 'Escribiendo...';
  @override
  String get lastSeen => 'Última vez visto';
  @override
  String get noConversations => 'No hay conversaciones';
  @override
  String get startConversation => 'Iniciar conversación';

  // Profile
  @override
  String get editProfile => 'Editar perfil';
  @override
  String get myServices => 'Mis servicios';
  @override
  String get myBookings => 'Mis reservas';
  @override
  String get settings => 'Configuración';
  @override
  String get help => 'Ayuda';
  @override
  String get about => 'Acerca de';
  @override
  String get privacyPolicy => 'Política de privacidad';
  @override
  String get termsOfService => 'Términos de servicio';
  @override
  String get language => 'Idioma';
  @override
  String get theme => 'Tema';
  @override
  String get lightTheme => 'Claro';
  @override
  String get darkTheme => 'Oscuro';
  @override
  String get systemTheme => 'Sistema';
  @override
  String get notificationsEnabled => 'Notificaciones activadas';
  @override
  String get locationEnabled => 'Ubicación activada';

  // Notifications
  @override
  String get newNotification => 'Nueva notificación';
  @override
  String get markAllRead => 'Marcar todo como leído';
  @override
  String get clearAll => 'Limpiar todo';
  @override
  String get noNotifications => 'No hay notificaciones';

  // Errors
  @override
  String get somethingWentWrong => 'Algo salió mal';
  @override
  String get networkError => 'Error de conexión';
  @override
  String get serverError => 'Error del servidor';
  @override
  String get unauthorizedError => 'No autorizado';
  @override
  String get notFoundError => 'No encontrado';
  @override
  String get validationError => 'Error de validación';

  // Date & Time
  @override
  String get today => 'Hoy';
  @override
  String get yesterday => 'Ayer';
  @override
  String get tomorrow => 'Mañana';
  @override
  String get justNow => 'Ahora mismo';
  @override
  String minutesAgo(int minutes) => 'hace $minutes minutos';
  @override
  String hoursAgo(int hours) => 'hace $hours horas';
  @override
  String daysAgo(int days) => 'hace $days días';
}