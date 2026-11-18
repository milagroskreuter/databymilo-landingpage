import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const POSTS = [
  {
    slug: "hola-cuaderno",
    title: "Hola, cuaderno nuevo",
    date: "2026-04-23",
    excerpt: "Abro este espacio para escribir las cosas que no entran en un reel: casos reales, errores que cometí y data traducida al español.",
    tags: [],
    cover_image: "",
    published: true,
    content: `Desde hace tiempo que le vengo dando vueltas a la idea de tener un lugar donde escribir **más largo**. En Instagram cabe un consejo, una fórmula, un chiste. Pero hay cosas que necesitan párrafos: no un reel de quince segundos.

## Por qué un blog

Cuando empecé a aprender datos, las dudas no eran sobre sintaxis. Eran sobre **por qué** hacer las cosas de una manera y no de otra. Esas respuestas no viven en un tutorial de cinco minutos: viven en conversaciones largas con alguien que ya pasó por ahí.

Quiero que este cuaderno sea eso. Un lugar para:

- Contar casos reales, con los errores incluidos, no solo la versión prolija
- Traducir conceptos que están en inglés con demasiada jerga
- Escribir las explicaciones que a mí me hubiera gustado leer cuando arranqué

## Qué esperar

Un post cada par de semanas, más o menos. A veces técnicos (SQL, Excel, Python). A veces sobre la carrera en sí: cómo moverse sin bootcamp, cómo leer ofertas de trabajo, cómo negociar sueldos.

Nada forzado. Si no tengo algo que valga la pena decir, no publico.

Si querés que te avise cuando hay post nuevo, [sumate a la newsletter](/#newsletter): mando un resumen los domingos.

Gracias por estar acá.`,
  },
  {
    slug: "el-sql-lo-arreglas-en-10-minutos",
    title: "El SQL lo arreglás en 10 minutos",
    date: "2026-05-20",
    excerpt: "Lo que aprendí cuando entendí que el problema nunca fue el SQL. O: por qué las conversaciones que no tuviste te cuestan más que cualquier bug.",
    tags: ["reflexiones", "datos", "carrera"],
    cover_image: "",
    published: true,
    content: `Estábamos repasando un proyecto que se había vuelto un dolor de cabeza. No me acuerdo qué le estaba contando puntualmente (algo de un dashboard que el área de operaciones decía que estaba "roto"), y en medio de mi explicación, mi supervisor me cortó con una frase que me sigue dando vueltas en la cabeza varios días después:

*"Los problemas casi nunca son técnicos. Son humanos."*

Lo dijo medio al pasar, como quien suelta una verdad que ya tiene gastada de tanto comprobarla. Y yo me quedé callada un segundo, porque sentí ese clic medio incómodo de cuando alguien te nombra una cosa que sabías sin saber. Una de esas cosas que estaba ahí, esperando que vos la dijeras en voz alta para volverse evidente.

Cuanto más lo pienso, más sentido tiene. Y más entiendo por qué nadie te lo explica al principio.

## La promesa del bootcamp

Cuando entrás a un mundo técnico (IT, datos, cualquier rincón de tecnología), el bootcamp, el curso, la carrera, todo te promete que el trabajo va a ser lo técnico. Vas a aprender SQL. Vas a hacer dashboards. Vas a escribir Python. Vas a entender modelos, métricas, ETLs, querys que te resuelven la vida. Te enamorás un poco de la idea de que vas a tener un superpoder específico, medible, demostrable. Algo que la gente no técnica no puede hacer y por lo tanto va a tener que respetar.

Y después arrancás. Y te das cuenta, de a poco, casi sin darte cuenta, de que el SQL es la parte fácil.

Lo digo en serio. La parte que parecía más imposible cuando arrancabas, la parte que te hizo googlear "soy tonta para programar?" un millón de veces, la parte que te tenía despierta a las dos de la mañana arreglando un join, esa parte después se vuelve casi automática. La pelea diaria, la verdadera, no está en el código. Está en otro lado.

## La traducción simultánea que nadie te enseña

**Cuántas veces dijiste "el dashboard está roto" cuando en realidad nadie te dijo qué tenía que mostrar.**

Te tiraron el pedido por Slack en una línea. Vos le pusiste tu mejor interpretación. Lo armaste con cariño, elegiste paleta, ordenaste KPIs, sumaste filtros. Lo presentaste. Y a la primera reunión te dijeron "no, esto no es lo que quería". Y te volviste a tu compu pensando que el problema era una métrica mal calculada, una visualización mal elegida, un filtro mal puesto. Y no. El problema fue que arrancaste a construir antes de hacer la pregunta incómoda: "¿esto lo vas a usar para qué?".

**Cuántas veces "el pipeline falló" fue en realidad alguien upstream cambió algo y no avisó.**

Una columna que se renombró. Un campo que pasó de string a fecha. Un sistema que migraron y nadie se acordó de que vos consumías esa tabla. El error técnico en tus logs es real, sí. Pero el problema real pasó dos semanas antes, en una reunión a la que vos no fuiste, donde alguien dijo "vamos a actualizar X" y nadie levantó la mano para preguntar quién dependía de eso.

**Cuántas veces "el reporte no sirve" fue nunca preguntamos para qué lo querían.**

Lo armaste limpio, prolijo, con métricas correctas, con una storyline. Y se quedó muerto en una carpeta de Drive porque resulta que la persona que lo pidió lo necesitaba para una decisión que ya tomó la semana pasada. O para una junta que era ese mismo día. O lo necesitaba para defender un presupuesto, y vos le diste el número crudo cuando lo que necesitaba era contexto, comparación, una recomendación.

El SQL lo arreglás en 10 minutos. La conversación que no tuviste te cuesta tres semanas de retrabajo.

Esa es la matemática que nadie te enseña en el bootcamp. Y es la matemática más cara del trabajo.

## El olfato

Con el tiempo aprendés a oler los problemas humanos disfrazados de problemas técnicos. Hay señales: cuando el mismo "fix" vuelve cada dos semanas con otra cara. Cuando el feedback que recibís es vago ("está como medio así, no termina de cerrarme") y nadie es capaz de decirte qué cambiarías concretamente. Cuando alguien te pide algo "para mañana" y no te puede explicar para qué. Cuando dos áreas te piden lo mismo pero con números distintos y cada una insiste que la suya es la verdadera. Cuando todo el mundo dice que un proceso está "automatizado" pero hay tres personas mandándose mails con planillas adjuntas.

Ese es el olor. No huele a bug. Huele a conversación pendiente.

Y es medio paradójico, porque entrás a IT pensando que el trabajo es la parte técnica, y terminás dándote cuenta de que la parte técnica es la más fácil. Lo difícil es alinear expectativas antes de empezar a tipear. Es hacer las preguntas incómodas en el momento incómodo, no después. Es traducir entre el área de negocio que te pide "una vista global" y los datos crudos que tenés que conectar para llegar a algo medianamente parecido a eso. Es entender que cuando te dicen "rápido" tal vez no significa "hoy a la tarde", significa "estoy desesperado y nadie me está dando una respuesta clara". Es saber que detrás de cada pedido confuso hay un humano confundido que también está bajo presión.

## La habilidad invisible

Lo más raro es que traducir (esa habilidad de entender lo que la otra persona NO te está diciendo, hacer las preguntas que destraban un proyecto, devolver una respuesta en su idioma y no en el tuyo) no aparece en ningún curso. No hay un "Curso de Traducción Negocio-Datos para Dummies". Lo aprendés a los golpes. Lo aprendés cada vez que entregás algo que no era lo que pedían y te toca volver a empezar. Lo aprendés cuando una decisión grande se toma con un dato que vos generaste y por primera vez entendés que el número que mostraste podía haber sido tres números distintos según cómo lo cruzaras, y eso lo tendrías que haber discutido antes, no después.

También lo aprendés mirando a la gente que ya lo sabe. Porque hay una diferencia enorme entre la persona técnica que se queda esperando que le pasen un brief perfecto, y la persona técnica que entra a una reunión con cinco preguntas escritas en una libreta porque ya sabe que los humanos no piden lo que quieren: piden lo que creen que quieren, y eso casi nunca es lo mismo.

## Por qué nos cuesta aceptarlo

Y creo que parte de por qué a muchas nos cuesta aceptar esto es por puro orgullo. Porque te formaste para ser técnica. Estudiaste, peleaste el síndrome del impostor, escribiste mil queries, te hiciste lugar en un mundo donde nadie te lo estaba reservando. Vos quisiste ser la chica de los datos. Y de repente alguien te dice que el 70% de tu trabajo va a ser conversaciones, política de oficina, traducción, reuniones donde tenés que repetir cosas obvias hasta que calen. Cuesta. Cuesta porque no es lo que firmaste.

Pero también cuesta porque es más vulnerable. Trabajar en silencio con un editor de código abierto se siente seguro. Mandar un Slack que dice "antes de arrancar, ¿me podés explicar qué decisión vas a tomar con esto?" se siente exponerte. Te abre a que te digan que estás haciendo demasiadas preguntas, que estás siendo lenta, que para qué hacés tanta vuelta. Y a veces te lo dicen. Te ponen cara. Te hacen sentir que estás complicando algo simple.

Pero la otra opción es entregar tres semanas después algo que no servía. Y eso, además de doler, te vuelve a costar la conversación que no quisiste tener al principio. Solo que ahora la tenés con más miedo, más cansancio, y un proyecto fallido encima.

A la larga, hacer las preguntas a tiempo es siempre el camino más corto. Aunque al principio se sienta el más largo.

## Tener a alguien que te lo recuerde

También ayuda mucho (y esto no es un detalle menor) tener un supervisor que tenga esto claro y te lo recuerde. Tener a alguien que en vez de decirte "arreglá el dashboard" te diga "frená un segundo, ¿estás segura de que ese es el problema?". Que te pregunte si hablaste con la persona que lo pidió antes de meter mano en el código. Que te muestre, con paciencia, que esa conversación incómoda que estás postergando vale más que cualquier cosa que puedas escribir esa tarde.

No todos lo tienen. Mucha gente aprende esto sola, a los cachetazos, después de años de retrabajo. Y cuando lo tenés temprano, te conviene aprovecharlo: anotar lo que dice, observar cómo maneja las reuniones difíciles, prestarle atención a las preguntas que hace que vos no te animaste a hacer. Y eventualmente convertirte en esa persona para alguien más.

## Lo que todavía me cuesta

Lo que todavía me cuesta entender bien (y por eso supongo que esto se va a quedar dando vueltas un rato más) es que la idea de que "los problemas son humanos" no es solo una observación. Es una invitación. Te está diciendo dónde poner la atención. Te está diciendo que la próxima vez que algo "no funcione", la primera pregunta no es *¿qué falla en mi código?*, es *¿qué conversación me faltó?*.

Te está diciendo que ser buena en datos no es saberse todas las funciones de Excel ni tener cinco certificaciones. Es saber qué pregunta hacerle a la tabla. Y antes de eso, qué pregunta hacerle a la persona que te pidió la tabla.

El código casi siempre se puede arreglar.

La conversación que no tuviste, casi nunca.

Y por eso, aunque me gane la vida escribiendo SQL, el músculo que más quiero entrenar este año no es técnico.

Es el de hacer las preguntas incómodas. A tiempo. Antes de abrir el editor.`,
  },
  {
    slug: "diez-cosas-antes-de-cumplir-25",
    title: "Diez cosas que ojalá alguien me hubiera dicho antes de cumplir 25",
    date: "2026-05-25",
    excerpt: "Lo que cambió en mi cabeza en tres años laburando en tech, y las decisiones que me hubiera convenido tomar antes.",
    tags: ["reflexiones", "carrera"],
    cover_image: "",
    published: true,
    content: `A los 22 daba por hecho que a los 25 algunas cosas iban a estar más claras. La carrera, los próximos pasos, qué quería hacer con la cabeza despierta de cada día. Tenía la idea de que el tiempo solo iba a ir acomodando todo en su lugar y que llegar a los 25 era una especie de checkpoint donde una entendía un poco más sobre quién es y para dónde va. Resulta que llegué a los 25 y la cabeza no se me ordenó por inercia. Lo único que sí cambió bastante es la lista de cosas que dejé de creerme y las que pasé a tomarme en serio. Ese cambio vino de tres años laburando adentro de una empresa de tecnología grande, de equivocarme cosas que no quiero contar en voz alta y de ver cómo se mueve la pelota desde adentro, donde la versión que aparece en LinkedIn no se parece tanto a lo que pasa de verdad.

Este post es, en buena medida, lo que me hubiera servido leer a los 22 y tener como pestaña abierta para los días en los que dudaba. Son las cosas que en mi cabeza pesan más ahora que antes, sin pretensión de funcionar como receta universal. Algunas las aprendí en mi primer trabajo en sistemas, donde a los 20 me dieron una guardia semanal en la que si yo apretaba mal una tecla una empresa entera se quedaba sin operar. Otras las aprendí en el proceso de aplicar ocho veces a la misma consultora antes de entrar, leyendo el "no" desde ángulos distintos cada vez. Otras vinieron de dejar la carrera dos veces sin saber qué quería estudiar y de empezar de nuevo siendo más grande que la mayoría. Y muchas las fui sumando viendo, desde adentro, cómo funciona realmente el mundo corporativo de tech en Latinoamérica.

Van por orden aproximado de impacto en mí. La primera me costó tres años entenderla.

## 1. Estar cómoda a los 20 sale caro

A los 22 tenía un primer trabajo en sistemas bastante más allá de lo razonable para mi nivel de experiencia. Una guardia semanal donde si yo me equivocaba una empresa entera se quedaba sin operar, decisiones a las dos de la mañana, llamados que tenía que atender mientras me lavaba los dientes. La presión era real, el aprendizaje también. Y al mismo tiempo tenía la opción de volver a una zona conocida cada vez que el cuerpo decía "esto es demasiado". Esa zona conocida era, en su momento, lo que yo llamaba estabilidad. Con los años entendí que en realidad estaba pagando un costo bastante alto por sentirme tranquila.

Cada año que te quedás en algo porque está bien es plata, es energía y son opciones que después no vuelven. La tolerancia al riesgo a los 22 no es la misma que a los 30. A los 30 ya hay cuentas, responsabilidades, contratos de alquiler firmados, gente que depende de cómo te va. A los 22 podés dormir en una cama prestada un par de meses sin que se caiga el mundo, podés probar algo medio loco y volver, podés mandarte a una entrevista sin red abajo. Esa elasticidad es un recurso escaso, y muchas veces lo gastamos en quedarnos quietas, esperando una señal del cielo que nunca llega.

Quedarse en algo cómodo durante tres años cuesta exactamente lo que valía aprender otra cosa en esos tres años. Una vez que lo empezás a ver desde ese ángulo, la frase "estoy bien acá" deja de ser un escudo y pasa a ser una elección con factura.

## 2. La "estabilidad" del trabajo en blanco es media mentira

A los 22 tenía la idea de que un trabajo en blanco, fijo, con recibo, era una especie de blindaje contra el mundo. En el último par de años vi rondas de despidos en empresas grandes que parecían intocables, y los criterios casi nunca tenían lógica desde afuera. Hay gente que llevaba diez años en el mismo lugar y se enteró por mail. Hay gente excelente que quedó afuera. Hay equipos enteros que cerraron de un día para el otro. Y lo que vi una y otra vez es que las personas que salieron paradas no eran las del cargo más lindo. Eran las que tenían skills concretos, una red genuina y la capacidad de moverse rápido cuando aparecía la posibilidad.

La estabilidad real, la que te sostiene cuando el mercado se mueve, está en otras variables. Vive en lo que sabés hacer en concreto, en a quién conocés y en cuán fácil te resulta encontrar otra cosa si esta se cae. El nombre de la empresa en el LinkedIn sirve para una etapa específica de tu carrera y después pesa menos de lo que parece.

Esto sirve para ordenar prioridades. Si lo único que estás construyendo es antigüedad en un solo lugar, estás construyendo algo bastante frágil. Está bien si esa decisión es consciente. Si no lo es, conviene mirarla.

## 3. Nadie te va a venir a salvar la carrera

Mucho del tiempo que perdí entre los 19 y los 22 lo gasté esperando. Esperando a que alguien me viera, a que un profesor me sugiriera por dónde ir, a que el sistema en algún momento me indicara cuál era mi siguiente paso. Dejé la carrera dos veces porque sentía que algo no encajaba, y ninguna de esas dos veces tuve a alguien diciéndome lo más obvio del mundo, que la próxima carrera no me iba a encajar tampoco si yo no le ponía algo de cabeza al asunto. Esperé que el problema se resolviera por afuera de mí. No se resolvió.

Lo aprendí tarde, casi pasados los 22. Nadie iba a aparecer con un mapa. El mentor perfecto, el jefe que te ve, la oportunidad que cae del cielo, la consultora que te llama porque sí. Esas cosas pasan, pero pasan después, una vez que vos ya empezaste a mover algo, una vez que ya hay un rastro de cosas hechas que alguien puede mirar. Como punto de partida son loterías.

Lo que tiene un porcentaje alto de funcionar es bastante menos glamoroso. Identificar qué skill te falta para el próximo paso, buscarlo gratis (hay todo en YouTube, en cursos abiertos, en documentación oficial), hacer un proyectito propio aunque sea de juguete, y empezar a mostrar que sabés ahora, no el cuatrimestre que viene. Es menos romántico que la idea del mentor que aparece, y al mismo tiempo es lo único que mueve la aguja para la mayoría.

## 4. El título del cargo es teatro corporativo

El cargo lindo te sirve para los asados, para el perfil de LinkedIn y para sentirte bien en la firma de mail. En los momentos de cimbronazo del mercado, lo que sostiene son los skills concretos que te llevás a cualquier industria. Saber escribir bien un mensaje complicado, entender un negocio en cinco minutos, manejar SQL, leer datos sin pánico, hablar en inglés sin tropezarte cada cinco palabras. El cargo, en esos momentos, vale lo que vale el papel del título.

Esta es una que me costó ver porque pasé varios años queriendo el cargo lindo. Quería el título, quería la firma, quería el "y vos a qué te dedicás" con respuesta corta y prestigiosa. Lo que cambió la película fue darme cuenta de que el inglés, que para mí era una habilidad medio invisible y que daba por hecha, fue probablemente el skill que más puertas me abrió. Más que cualquier carrera, más que cualquier cargo. Y el inglés no estaba en ninguna lista de "tips para conseguir trabajo en tech". Estaba ahí, como una herramienta sin marketing, esperando que yo me diera cuenta de cuánto pesaba.

La pregunta que aprendí a hacerme después de los 22 es qué cinco skills concretos quiero tener tan internalizados que ninguna empresa pueda desplazarme fácilmente. Es bastante más útil que preguntarse qué cargo quiero tener en cinco años, porque el cargo depende de mil variables que no controlás y los skills dependen mayormente de vos.

## 5. No odiás hacer networking, estás esquivando la incomodidad

Durante años usé la palabra "networking" como sinónimo de algo turbio. Me daba pereza, me daba un poco de vergüenza, sentía que era para gente más extrovertida o más oportunista que yo. Esa creencia me ahorró muchísimas conversaciones incómodas y, al mismo tiempo, me costó varias oportunidades que recién entendí más tarde que me había perdido.

La gente que hoy admirás construyó relaciones antes de necesitarlas. Eso lo aprendí mirando hacia atrás, viendo que en mi caso casi todas las cosas buenas que me pasaron en estos tres años vinieron por relaciones que yo había empezado sin propósito específico. Una persona que me mandó un mensaje porque le gustó un comentario mío en LinkedIn. Una excompañera que me presentó a alguien que después terminó siendo mi referente para una entrevista. Una conversación tonta en el baño de una conferencia que dos años después se transformó en un contacto clave.

La fórmula no es complicada. Dos mensajes por semana a personas que hacen lo que vos querés hacer. Un comentario real, no "qué buena reflexión", en sus posts. Algo que ofrecer antes de pedir, aunque sea un recurso, una opinión, un agradecimiento puntual. La incomodidad es real, y la regla es que la práctica disuelve la mayoría. A los seis meses ni te acordás del nudo en el estómago del primer mensaje.

## 6. Andate antes de estar lista

Esta es contraintuitiva. La idea social que tenemos sobre cuándo cambiar de trabajo está bastante atada al sentido común de quedarse hasta agotar lo que el lugar tiene para dar. El problema es que cuando el lugar ya no tiene nada para dar, una está cansada, resentida, sin energía para una buena entrevista. Los procesos de búsqueda salen mucho mejor cuando todavía tenés combustible, cuando estás bien en tu trabajo actual pero hay algo dentro tuyo que ya pide más.

Yo lo viví en carne propia con las ocho aplicaciones a la misma consultora. Las primeras seis las hice desde un lugar de "necesito esto, necesito esto, necesito esto", desde la urgencia, desde la cabeza agotada de explicarme por qué no me llamaban. Las últimas dos las hice desde otro lugar, con un trabajo que estaba bien, con tiempo, con la posibilidad de prepararme mejor. La octava fue la que entró. No creo que sea una casualidad.

La práctica concreta es entrevistarte cada seis o doce meses aunque no estés buscando. Para saber qué hay afuera, para saber cuánto valés en el mercado, para mantener la habilidad de entrevistarte (es una habilidad y se atrofia si no la ejercitás). Y, sobre todo, para no llegar a ese momento donde estás tan al límite que cualquier oferta parece la salvación. Eso casi nunca termina bien.

## 7. Usá el síndrome del impostor a favor

A los 20, en ese primer trabajo de sistemas, vivía con el corazón en la garganta. Tenía la certeza interna de que iban a descubrir que yo no era una persona técnica, que había llegado ahí por error, que no merecía estar en esas reuniones. Cada vez que mi jefe me hacía una pregunta yo pensaba "bueno, esta es la que me delata". Esa sensación me acompañó durante años y durante años la peleé como si fuera un problema a resolver.

Lo que aprendí después es que el síndrome del impostor, en la mayoría de los casos, funciona como un termómetro. Si lo sentís, estás un nivel arriba de tu zona cómoda y estás aprendiendo a velocidad alta. El día que te sentís cómoda al 100, ya dejaste de crecer y tu salario seguramente lo va a sentir antes que vos.

Si te peleás todo el tiempo con el síndrome del impostor, gastás energía intentando convencerte de que merecés estar donde estás. Si lo empezás a usar como brújula, esa misma energía queda disponible para otras cosas. La regla práctica que me ayudó es esta. Si una situación me incomoda mucho pero todavía la puedo sostener, probablemente esté en el lugar correcto. Si una situación ya no me incomoda nada, probablemente sea hora de buscar otra. La incomodidad bien dosificada funciona como información de progreso. Tratarla como un problema a resolver es lo que la convierte en parálisis.

## 8. Dejá de perseguir lo que te apasiona

Esta es la que más le pelea a la versión de mí más joven. A los 18, a los 19, a los 20, dejé y volví a empezar carreras buscando la palabra "pasión". Quería ese sentimiento de claridad total, esa cosa de "para esto vine al mundo". Cuando no aparecía, asumía que era porque me había equivocado de elección y arrancaba de nuevo. Dejé dos carreras enteras buscando algo que en realidad no funciona como punto de partida.

La pasión llega en general después de hacer algo el tiempo suficiente como para que te empiece a salir bien. Antes de eso, todo lo nuevo se siente medio incómodo, medio aleatorio, medio "tal vez no es lo mío". Si te vas de cada cosa antes de pasar ese umbral, no vas a sentir pasión por nada. No porque no haya algo en este mundo para vos. El umbral simplemente no se cruza cuando una se baja del barco a la mitad.

La pregunta más útil que me hago ahora es qué intersección hay entre lo que sé hacer, lo que el mercado paga y lo que puedo sostener sin odiarme. Esa intersección es chiquita y, si la pasión llega, va a aparecer adentro de esa intersección. Buscarla en un lugar totalmente desconocido, sin medir ni habilidad ni demanda ni sostenibilidad, es la receta para los cuatro cambios de carrera en cinco años. Yo hice dos y con eso me alcanzó para entender el patrón.

## 9. Laburar en silencio ya no es cool

Crecí con la idea de que mostrar lo que hacés era de poco serio. Que el laburo bueno se hacía en silencio, que las cosas se notaban solas, que con esfuerzo y dedicación las oportunidades llegaban tarde o temprano. Era una creencia bonita y bastante poco verificada empíricamente. Lo que vi en estos tres años contradice esa idea bastante de frente. La gente que muestra lo que está aprendiendo, lo que está construyendo, lo que está pensando, atrae oportunidades que la gente igualmente buena pero silenciosa no atrae.

Es importante separar esto de la idea de fabricarse un personaje o cocinar contenido para vender. Hablo de cosas más simples. Contar en LinkedIn un proyecto que terminaste, explicar un concepto que te costó, compartir un recurso que te sirvió, mostrar una equivocación y cómo la resolviste. Cosas chicas, sostenidas en el tiempo, que construyen una superficie que después la gente puede ver.

Y hay un efecto bonus que descubrí casi de casualidad. Cuando contás lo que estás haciendo, otras personas te buscan para charlar, para preguntarte, para colaborar. Esos puentes después se traducen en cosas concretas, ofertas, contactos, ideas. El silencio te deja en una posición donde dependés exclusivamente de que la suerte te encuentre. Mostrarte le facilita el camino.

## 10. Dejá de esperar a estar "lo suficientemente calificada"

Esto se relaciona con casi todas las anteriores. Hay una creencia bastante instalada, sobre todo en mujeres, de que primero hay que estar "lista" y después aparecer. Lista significa tener el título, tener los años de experiencia, tener la certificación, tener la autoridad, tener el "derecho" a hablar. Es una trampa que se autoalimenta, porque la sensación de no estar lista nunca termina, ni siquiera cuando objetivamente ya lo estás.

Yo arranqué a postear sobre lo que aprendía sin sentirme experta de nada, con esa cosa de "quién soy yo para opinar". Lo que descubrí es que la mayoría de la gente está esperando lo mismo, y nadie te avisa cuando llega el momento. No hay un certificado que te llegue por mail diciendo "ya, ahora podés". El permiso te lo das vos o no te lo da nadie.

Aparecer una vez por semana y compartir cómo pensás algo de tu trabajo le gana, a largo plazo, a esperar tener veinte años de experiencia. La experiencia importa muchísimo, ojo, y se acumula con o sin que estés mostrando. La diferencia es que mostrar te suma una capa más que la experiencia sola no te da. Llamémosle visibilidad, llamémosle red, llamémosle que la gente sepa quién sos antes de que tengas el cargo lindo. Sea lo que sea, ahorra años.

## Cierre

Nada de esto es revolucionario, ya lo sé. Si una se pone a buscar, hay libros, podcasts, hilos enteros que dicen lo mismo. Lo que cambia con los años, en general, es el momento en que la información te encuentra. La información en sí está disponible desde siempre. A los 22 yo podía haber leído este mismo post, haberlo guardado en favoritos y haberme olvidado al día siguiente. Tres años después, las mismas frases me caen distinto porque ya tengo cicatrices que se las hacen pegar.

Por eso ningún consejo es universal. Cada una de estas cosas a vos te va a hacer click en un momento distinto, o a lo mejor nunca. Lo único que puedo prometer es que algunas, si las tomás a tiempo, te ahorran un par de años de ir averiguando sola.

Lo otro que quiero decir es que yo no tengo esto resuelto del todo. Sigo dudando, sigo equivocándome, sigo metiendo la pata en cosas que después miro y digo "lo sabía y lo hice igual". Eso pasa, es parte del proceso. Lo que busco a esta altura es tener un poquito más de criterio para no romperme en lugares donde antes me rompía. La cabeza no se ordena del todo, eso ya lo sé.

Si llegaste hasta acá, gracias por bancar un post largo. Si alguna de las diez te pegó fuerte, contame cuál. Si conocés a alguien que está en el medio del lío laboral, mandáselo, capaz le sirve. Y si algo de esto te parece equivocado, doble gracias, porque me encantaría leer la versión donde lo que digo no funciona, para revisarla.`,
  },
];

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase.from("blog_posts").select("slug");
    const existingSlugs = new Set((existing || []).map((p) => p.slug));

    const toInsert = POSTS.filter((p) => !existingSlugs.has(p.slug));
    if (toInsert.length === 0) {
      return Response.json({ ok: true, message: "Ya están todos los posts migrados", skipped: POSTS.length });
    }

    const { data, error } = await supabase.from("blog_posts").insert(toInsert).select("slug");
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ ok: true, inserted: data.map((p) => p.slug) });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
