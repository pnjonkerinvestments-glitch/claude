import { Check, Flag, Building2, MapPin, Route, ListOrdered } from 'lucide-react';
const stages = [['flags', Flag], ['capitals', Building2], ['pinpoint', MapPin], ['borders', Route], ['order', ListOrdered]] as const;
export function JourneyRoute({ step = 0, complete = false, t, compact = false }: { step?: number; complete?: boolean; t: (key: string) => string; compact?: boolean }) {
    return <ol className={'journey-route' + (compact ? ' compact' : '')} aria-label={t('journeyStages')}>
        {stages.map(([name, Icon], i) => <li key={name} className={complete || i < step ? 'visited' : i === step ? 'current' : ''} aria-current={!complete && i === step ? 'step' : undefined}>
            <span className="journey-stop">{complete || i < step ? <Check size={20}/> : <Icon size={20}/>}</span>
            <span className="journey-stage-name"><small>{i + 1}</small>{t(name + 'Hint')}</span>
        </li>)}
    </ol>;
}
