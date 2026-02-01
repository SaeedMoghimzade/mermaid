
export type ParticipantType = 'participant' | 'actor';

export interface Participant {
  id: string;
  name: string;
  type: ParticipantType;
  color?: string; // Hex color code
}

export type ArrowType = '->' | '-->' | '->>' | '-->>' | '-x' | '--x' | '-)' | '--)';

export type StepType = 
  | 'message' 
  | 'note' 
  | 'loop' 
  | 'alt' 
  | 'else' 
  | 'opt' 
  | 'end' 
  | 'autonumber' 
  | 'activate' 
  | 'deactivate';

export interface DiagramStep {
  id: string;
  type: StepType;
  from?: string; // Participant ID
  to?: string;   // Participant ID
  text?: string;
  arrow?: ArrowType;
  position?: 'left of' | 'right of' | 'over';
  actor?: string; // For notes
}

export interface DiagramState {
  participants: Participant[];
  steps: DiagramStep[];
  title: string;
  autoNumber: boolean;
}
