# Рабочий пример

`ToyboxCounterReveal` показывает, как использовать фаски, дерево, резиновую посадку, цветную крышку на шарнире и отдельный силиконовый профиль отскока в самостоятельной сцене Toybox.

Из `video/` после `npm ci`:

```sh
npx remotion studio ../skills/toybox-3d/examples/CounterReveal.tsx
npx remotion still ../skills/toybox-3d/examples/CounterReveal.tsx ToyboxCounterReveal out/toybox/reveal.png --frame=42 --gl=swangle
```

Управляй моментом открытия через `toyTransitionProgress`, положение шарнира задавай в координатах родительского объекта. Детали шарнира должны находиться внутри `ToyHinge`, а опора и предмет остаются в родительском пространстве. Для тяжёлого предмета попробуй профиль `TOY_MOTION.stone`, чтобы сравнить характер контакта.

[Полноценные сцены Toybox Hyper и карточки окружений](../../../video/src/ToyboxDemo.tsx) используют ту же библиотеку.

`ToyboxMaterialStudy` показывает шесть материалов под одной схемой Soft Studio. Используй его для сопоставления бликов, микрорельефа, отражения и разделения материалов.

```sh
npx remotion still ../skills/toybox-3d/examples/MaterialStudy.tsx ToyboxMaterialStudy out/toybox/materials.jpg --gl=swangle
```

[Фактический рендер материала](../../../renders/toybox-3d/materials.jpg).
