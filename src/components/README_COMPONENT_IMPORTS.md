Add these imports to src/App.tsx:

import { PageStructureCard } from "./components/PageStructureCard";
import { DSReadinessCard } from "./components/DSReadinessCard";
import { TechnicalContextCard } from "./components/TechnicalContextCard";

Then add these cards inside your bento-grid after <SnippetCard /> or before Active Pages:

<PageStructureCard system={selectedSystem} />
<DSReadinessCard system={selectedSystem} />
<TechnicalContextCard system={selectedSystem} />
