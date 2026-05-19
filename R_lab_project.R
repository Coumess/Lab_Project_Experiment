# =============================================================================
# 1. CLEAR ENVIRONMENT & INITIALIZE
# =============================================================================
rm(list = ls(all = TRUE))
if (names(dev.cur()) != "null device") graphics.off()

library(dplyr)
library(ggplot2)
library(lme4)
library(lmerTest)     # Ensures Satterthwaite p-values in summaries
library(emmeans)
library(modelsummary)
library(xtable)
library(rtdists)
library(tidyverse)

# =============================================================================
# 2. DATA IMPORT & PREPARATION
# =============================================================================
data <- read.csv("All data.csv", header = TRUE)

# Lock in core baseline factor references
data$label_face <- factor(data$label_face, levels = c("Attractif", "Unattractif"))
data$valence_word <- factor(data$valence_word, levels = c("negatif", "neutre", "positif"))
data$congruence <- factor(data$congruence, levels = c("congruent", "neutral", "incongruent"))
data$niveau_francais <- factor(data$niveau_francais, 
                               levels = c("Natif", "Bilingue_C2","Avance_C1","Intermediaire_B1_B2", "Debutant_A1_A2"))

# =============================================================================
# 3. DATA CLEANING & OUTLIER REMOVAL
# =============================================================================
# Step 3.1: Filter ambiguous stimuli (> 45% error rate)
taux_rejet <- data %>%
  group_by(stimulus) %>%
  summarise(reject_rate = mean(correct == 0, na.rm = TRUE), .groups = "drop")

stimuli_ambigus <- taux_rejet %>% 
  filter(reject_rate > 0.45) %>% 
  pull(stimulus)

# Step 3.2: Exclude predefined problematic/non-proficient IDs
id_outliers <- c("imgzntah", "jouau2am", "1v24kyhs")
id_non_native <- data %>%
  filter(niveau_francais %in% c("Intermediaire_B1_B2", "Debutant_A1_A2")) %>%
  pull(id) %>% 
  unique()

all_excluded_ids <- c(id_outliers, id_non_native)

# Step 3.3: Filter bad trials, non-natives, and ambiguous stimuli
data_clean <- data %>%
  filter(!id %in% all_excluded_ids, !stimulus %in% stimuli_ambigus)

# Step 3.4: Trim extreme Reaction Times (RT) via standard Boxplot hinges
bp <- boxplot.stats(data_clean$rt)
data_clean <- data_clean %>%
  filter(rt >= bp$stats[1], rt <= bp$stats[5])

# =============================================================================
# 4. MODEL 1: FACTORIAL ANALYSIS (FACE LABEL × WORD VALENCE)
# =============================================================================
model_fact <- lmer(rt ~ label_face * valence_word + (1 | id), data = data_clean)
anova_fact <- anova(model_fact, type = "III")

# =============================================================================
# 5. MODEL 2: CONGRUENCE ANALYSIS
# =============================================================================
model_cong <- lmer(rt ~ congruence + (1 | id), data = data_clean)
anova_cong <- anova(model_cong, type = "III")

# =============================================================================
# 6. DRIVERT COGNITION: COMPASSION VIA DDM MODEL OPTIMIZATION
# =============================================================================
dmc_objective <- function(pars, rt, response) {
  dens <- ddiffusion(rt, response, 
                     a = pars[1], t0 = pars[2], z = pars[3] * pars[1], v = pars[4])
  dens[dens <= 0] <- 1e-10
  return(-sum(log(dens)))
}

initial_params <- c(1.5, 0.2, 0.5, 1.0) 
lower_bounds   <- c(0.1, 0.05, 0.1, -5.0) 
upper_bounds   <- c(5.0, 1.0,  0.9,  5.0)

# Run Congruent
congruent_data <- data_clean %>% filter(congruence == "congruent", !is.na(rt), !is.na(response_binary))
fit_congruent <- nlminb(initial_params, dmc_objective, 
                        rt = congruent_data$rt, response = congruent_data$response_binary + 1,
                        lower = lower_bounds, upper = upper_bounds)

# Run Incongruent
incongruent_data <- data_clean %>% filter(congruence == "incongruent", !is.na(rt), !is.na(response_binary))
fit_incongruent <- nlminb(initial_params, dmc_objective, 
                          rt = incongruent_data$rt, response = incongruent_data$response_binary + 1,
                          lower = lower_bounds, upper = upper_bounds)

# Build dynamic DDM parameters matrix
ddm_results <- data.frame(
  Parameter = c("Boundary Separation (a)", "Non-Decision Time (t0)", "Relative Bias (z)", "Drift Rate (v)"),
  Congruent = fit_congruent$par,
  Incongruent = fit_incongruent$par
) %>%
  mutate(Difference = Incongruent - Congruent)

print("=== FINAL DDM COMPARISON MATRIX ===")
print(ddm_results)

# =============================================================================
# 7. EXPORT DATA VISUALIZATION SUITE
# =============================================================================

# --- PLOT 1: FACTORIAL INTERACTION LINE PLOT ---
agg_data <- data_clean %>%
  group_by(valence_word, label_face) %>%
  summarise(mean_rt = mean(rt, na.rm = TRUE), sem = sd(rt, na.rm = TRUE) / sqrt(n()), .groups = "drop")

ggplot(agg_data, aes(x = valence_word, y = mean_rt, group = label_face, color = label_face, shape = label_face)) +
  geom_line(linewidth = 1.2) +
  geom_point(size = 4.0) + 
  geom_errorbar(aes(ymin = mean_rt - sem, ymax = mean_rt + sem), width = 0.15, linewidth = 0.8) +
  scale_color_manual(values = c("Attractif" = "#1b9e77", "Unattractif" = "#d95f02")) +
  scale_shape_manual(values = c("Attractif" = 16, "Unattractif" = 17)) + 
  theme_classic(base_size = 14) +
  labs(title = "Reaction Times by Word Valence and Face Label", x = "Word Valence", y = "Mean Reaction Time (RT)", color = "Face Label", shape = "Face Label") +
  theme(legend.position = "top", plot.title = element_text(face = "bold"),
        panel.grid.major = element_line(color = "#e5e5e5", linewidth = 0.5))
ggsave("factorial_interaction.png", width = 7, height = 5, dpi = 300)

# --- PLOT 2: CONGRUENCE FOCUS TIMING GRAPH ---
agg_congruence <- data_clean %>%
  filter(congruence %in% c("congruent", "incongruent")) %>%
  group_by(congruence) %>%
  summarise(mean_rt = mean(rt, na.rm = TRUE), sem = sd(rt, na.rm = TRUE) / sqrt(n()), .groups = "drop")

ggplot(agg_congruence, aes(x = congruence, y = mean_rt, color = congruence)) +
  geom_linerange(aes(ymin = 0.65, ymax = mean_rt), linewidth = 4, alpha = 0.1, color = "black") +
  geom_point(size = 5, shape = 18) +
  geom_errorbar(aes(ymin = mean_rt - sem, ymax = mean_rt + sem), width = 0.15, linewidth = 1) +
  scale_color_manual(values = c("congruent" = "#27ae60", "incongruent" = "#8e44ad")) +
  coord_cartesian(ylim = c(0.68, 0.77)) + 
  theme_classic(base_size = 14) +
  labs(title = "Reaction Times by Trial Congruence", x = "Trial Structural Match", y = "Mean Reaction Time (RT)") +
  theme(legend.position = "none", plot.title = element_text(face = "bold"),
        panel.grid.major = element_line(color = "#e5e5e5", linewidth = 0.5))
ggsave("congruence_balanced_fixed.png", width = 5, height = 5, dpi = 300)

# --- PLOT 3: ENHANCED DDM SLOPE PLOT (IMPROVED LINEAR GRAPHICS) ---
ddm_long <- ddm_results %>%
  pivot_longer(cols = c(Congruent, Incongruent), names_to = "Condition", values_to = "Value") %>%
  mutate(Condition = factor(Condition, levels = c("Congruent", "Incongruent")))

ggplot(ddm_long, aes(x = Condition, y = Value, group = 1)) +
  # Adds a bold directional segment linking the points across conditions
  geom_line(color = "#2c3e50", linewidth = 1.3, alpha = 0.8) +
  # Different colorblind shapes applied to boundaries for crisp identification
  geom_point(aes(color = Condition, shape = Condition), size = 4.5, stroke = 1.2) +
  scale_color_manual(values = c("Congruent" = "#1b9e77", "Incongruent" = "#d95f02")) +
  scale_shape_manual(values = c("Congruent" = 16, "Incongruent" = 17)) +
  facet_wrap(~Parameter, scales = "free_y", ncol = 2) +
  theme_classic(base_size = 13) +
  labs(
    title = "Latent Cognitive Transitions across Task Congruency",
    subtitle = "Faceted slope paths tracking shifts in estimated DDM parameters",
    x = "Experimental State",
    y = "Model Parameter Scaling Space"
  ) +
  theme(
    legend.position = "top",
    plot.title = element_text(face = "bold", size = 14),
    strip.text = element_text(face = "bold", size = 11),
    strip.background = element_rect(fill = "#f3f4f6", color = NA),
    panel.spacing = unit(2, "lines"),
    panel.grid.major.y = element_line(color = "#e5e7eb", linewidth = 0.5)
  )
ggsave("ddm_slope_comparison.png", width = 8, height = 7, dpi = 300)