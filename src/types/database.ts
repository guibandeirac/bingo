export type UserRole = "player" | "admin";
export type EventStatus = "open" | "in_progress" | "finished";
export type BingoGameStatus = "waiting" | "cards_generated" | "in_progress" | "finished";
export type UnoTournamentStatus = "draft" | "duos_generated" | "bracket_generated" | "in_progress" | "finals" | "finished";
export type BracketType = "winners" | "losers" | "grand_final";
export type IndividualFinalType = "first_second" | "third_fourth" | "fifth_sixth";
export type GameType = "bingo" | "uno";

export interface DbUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  created_at: string;
}

export interface DbEvent {
  id: string;
  name: string;
  date: string;
  status: EventStatus;
  created_by: string;
  created_at: string;
}

export interface DbEventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  joined_at: string;
}

export interface DbBingoGame {
  id: string;
  event_id: string;
  status: BingoGameStatus;
  auto_mode: boolean;
  auto_interval_seconds: number | null;
  started_at: string | null;
  created_at: string;
}

export interface DbBingoDrawnNumber {
  id: string;
  game_id: string;
  number: number;
  drawn_at: string;
}

export interface DbBingoCard {
  id: string;
  game_id: string;
  user_id: string;
  numbers: number[];
  marked_numbers: number[];
  completed_at: string | null;
  position: number | null;
}

export interface DbUnoTournament {
  id: string;
  event_id: string;
  status: UnoTournamentStatus;
  created_at: string;
}

export interface DbUnoDuo {
  id: string;
  tournament_id: string;
  player1_id: string;
  player2_id: string;
  seed: number;
}

export interface DbUnoBracketMatch {
  id: string;
  tournament_id: string;
  bracket_type: BracketType;
  round: number;
  match_number: number;
  duo1_id: string | null;
  duo2_id: string | null;
  winner_id: string | null;
  is_bye: boolean;
  next_winner_match_id: string | null;
  next_loser_match_id: string | null;
}

export interface DbUnoIndividualFinal {
  id: string;
  tournament_id: string;
  match_type: IndividualFinalType;
  player1_id: string;
  player2_id: string;
  winner_id: string | null;
}

export interface DbGameResult {
  id: string;
  event_id: string;
  game_type: GameType;
  game_id: string;
  user_id: string;
  position: number;
  points: number;
  achieved_at: string;
}

// Joined / extended types for UI
export interface UserWithRole extends DbUser {
  isAdmin: boolean;
}

export interface EventWithParticipantCount extends DbEvent {
  participant_count?: number;
  is_participant?: boolean;
}

export interface BingoCardWithState extends DbBingoCard {
  cellStates: CellState[];
}

export type CellState = "white" | "yellow" | "green";

export interface BingoWinner {
  user_id: string;
  name: string;
  position: number;
  completed_at: string; // ISO UTC string — exibir convertido para Brasília
}

export interface UnoDuoWithPlayers extends DbUnoDuo {
  player1: DbUser;
  player2: DbUser;
}

export interface BracketMatchWithDuos extends DbUnoBracketMatch {
  duo1?: UnoDuoWithPlayers | null;
  duo2?: UnoDuoWithPlayers | null;
  winner?: UnoDuoWithPlayers | null;
}

export interface RankingEntry {
  user_id: string;
  name: string;
  total_points: number;
  wins: number;
}

// Supabase Database generic type (minimal, for createBrowserClient/createServerClient)
export type Database = {
  public: {
    Tables: {
      users: { Row: DbUser; Insert: Omit<DbUser, "created_at">; Update: Partial<DbUser> };
      events: { Row: DbEvent; Insert: Omit<DbEvent, "id" | "created_at">; Update: Partial<DbEvent> };
      event_participants: { Row: DbEventParticipant; Insert: Omit<DbEventParticipant, "id" | "joined_at">; Update: Partial<DbEventParticipant> };
      bingo_games: { Row: DbBingoGame; Insert: Omit<DbBingoGame, "id" | "created_at">; Update: Partial<DbBingoGame> };
      bingo_drawn_numbers: { Row: DbBingoDrawnNumber; Insert: Omit<DbBingoDrawnNumber, "id" | "drawn_at">; Update: Partial<DbBingoDrawnNumber> };
      bingo_cards: { Row: DbBingoCard; Insert: Omit<DbBingoCard, "id">; Update: Partial<DbBingoCard> };
      uno_tournaments: { Row: DbUnoTournament; Insert: Omit<DbUnoTournament, "id" | "created_at">; Update: Partial<DbUnoTournament> };
      uno_duos: { Row: DbUnoDuo; Insert: Omit<DbUnoDuo, "id">; Update: Partial<DbUnoDuo> };
      uno_bracket_matches: { Row: DbUnoBracketMatch; Insert: Omit<DbUnoBracketMatch, "id">; Update: Partial<DbUnoBracketMatch> };
      uno_individual_finals: { Row: DbUnoIndividualFinal; Insert: Omit<DbUnoIndividualFinal, "id">; Update: Partial<DbUnoIndividualFinal> };
      game_results: { Row: DbGameResult; Insert: Omit<DbGameResult, "id" | "achieved_at">; Update: Partial<DbGameResult> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      event_status: EventStatus;
      bingo_game_status: BingoGameStatus;
      uno_tournament_status: UnoTournamentStatus;
      bracket_type: BracketType;
      individual_final_type: IndividualFinalType;
      game_type: GameType;
    };
  };
};
