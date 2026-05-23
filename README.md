# Cheyipai Report Photo Downloader

Downloads all car inspection photos from a [Cheyipai](https://report.cheyipai.com) report and saves them into 4 categorised folders. Photo names are translated from Chinese to Russian.

---

## Requirements

- [Node.js](https://nodejs.org) 18 or newer

## Setup

```bash
npm install
```

## Usage

### Interactive (recommended)

```bash
npx tsx download.ts
```

You will be asked to paste the report URL:

```
==============================================
 Cheyipai Report Photo Downloader
==============================================

Paste the report URL from report.cheyipai.com and press Enter.
URL: https://report.cheyipai.com/report-optimus-h5/index?reportCode=...
```

### With URL as argument

```bash
npx tsx download.ts "https://report.cheyipai.com/report-optimus-h5/index?reportCode=...&templateCode=...&reportVersion=..."
```

## Output

Photos are saved to the `photos/` folder:

```
photos/
├── Exterior Photos/    — overview shots of the car exterior
├── Paint Photos/       — individual body panel photos
├── Annotated Photos/   — inspection photos with markings
└── Defect Photos/      — photos highlighting detected defects
```

Each photo is named with a Russian translation of its original Chinese label. Duplicate names within a folder are numbered: `Двигатель 1.jpg`, `Двигатель 2.jpg`, etc.

---

# Загрузчик фотографий отчёта Cheyipai

Скачивает все фотографии осмотра автомобиля из отчёта [Cheyipai](https://report.cheyipai.com) и сохраняет их в 4 папки по категориям. Названия фотографий переводятся с китайского на русский.

---

## Требования

- [Node.js](https://nodejs.org) версии 18 или новее

## Установка

```bash
npm install
```

## Использование

### Интерактивный режим (рекомендуется)

```bash
npx tsx download.ts
```

Программа попросит вставить ссылку на отчёт:

```
==============================================
 Cheyipai Report Photo Downloader
==============================================

Вставьте ссылку на отчёт с сайта report.cheyipai.com и нажмите Enter.
URL: https://report.cheyipai.com/report-optimus-h5/index?reportCode=...
```

### Передать ссылку как аргумент

```bash
npx tsx download.ts "https://report.cheyipai.com/report-optimus-h5/index?reportCode=...&templateCode=...&reportVersion=..."
```

## Результат

Фотографии сохраняются в папку `photos/`:

```
photos/
├── Exterior Photos/    — общие снимки кузова автомобиля
├── Paint Photos/       — снимки отдельных кузовных панелей
├── Annotated Photos/   — инспекционные фото с пометками
└── Defect Photos/      — фото обнаруженных дефектов
```

Каждое фото называется переводом исходного китайского названия на русский язык. Дублирующиеся названия внутри одной папки нумеруются: `Двигатель 1.jpg`, `Двигатель 2.jpg` и т.д.
