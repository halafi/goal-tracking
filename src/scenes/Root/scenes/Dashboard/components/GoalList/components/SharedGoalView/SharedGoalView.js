// @flow

import React, { PureComponent } from 'react'
import * as R from 'ramda'
import moment from 'moment'
import ExpansionPanel, {
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  ExpansionPanelActions,
} from 'material-ui/ExpansionPanel'
import Typography from 'material-ui/Typography'
import List, { ListItem, ListItemText, ListItemSecondaryAction } from 'material-ui/List'
import { withStyles } from 'material-ui/styles'
import Button from 'material-ui/Button'
import ExpandMoreIcon from 'material-ui-icons/ExpandMore'
import Divider from 'material-ui/Divider'
import Avatar from 'material-ui/Avatar'
import Checkbox from 'material-ui/Checkbox'
import TextField from 'material-ui/TextField'
import type { SharedGoal, SharedGoalUser } from '../../../../../../../../common/records/SharedGoal'
import {
  getElapsedMinutesBetween,
  getElapsedDaysTillNow,
  getElapsedDaysBetween,
} from '../../../../../../../../common/services/dateTimeUtils'
import type { User, Users } from '../../../../../../../../common/records/Firebase/User'
import DateTimePicker from '../../../../../../../../common/components/DateTimePicker/DateTimePicker'

type Props = {
  goal: SharedGoal,
  users: Users,
  currentUserId: string,
  onDelete: () => void,
  onChangeDate: (string, number) => void,
  onRenameGoal: any => void,
  onExpand: any => void, // SyntheticEvent<>
  onAcceptSharedGoal: () => void,
  onFail: () => void,
  onComplete: () => void,
  classes: Object,
  readOnly: boolean,
  expanded: boolean,
}

const styles = theme => ({
  formWrapper: {
    width: '100%',
  },
  form: {
    padding: '0',
  },
  textField: {
    marginLeft: '0px',
    marginRight: '16px',
    width: '150px',
  },
  dateTimePicker: {
    display: 'inline-block',
    marginLeft: '0px',
    marginRight: '16px',
    width: '255px',
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    flexBasis: '33.33%',
    flexShrink: 0,
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
  },
  panelContainer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
})

type Participant = SharedGoalUser & User

class SharedGoalView extends PureComponent<Props> {
  render() {
    const {
      goal,
      users,
      currentUserId,
      onDelete,
      onChangeDate,
      onRenameGoal,
      onExpand,
      onAcceptSharedGoal,
      onFail,
      onComplete,
      classes,
      readOnly,
      expanded,
    } = this.props

    const elapsedDaysTillNow = getElapsedDaysTillNow(goal.started)
    const finished = elapsedDaysTillNow >= goal.target

    if (!users) {
      return null
    }

    const participants: Array<Participant> = goal.users
      .sort((a, b) => (a.id === currentUserId ? -1 : a.id.localeCompare(b.id)))
      .map(x => ({ ...x, ...users[x.id] }))

    const currentParticipant: ?Participant = R.compose(
      R.defaultTo(null),
      R.head,
      R.filter(R.propEq('id', currentUserId)),
    )(participants)

    const goalInMinutes = getElapsedMinutesBetween(
      goal.started,
      moment(goal.started)
        .add(goal.target, 'd')
        .valueOf(),
    )

    // TODO: when last user abandons - > delete goal
    // TODO: able to finish goal which would award every player that did not fail

    // TODO: last man standing checkbox
    // TODO: make public
    // TODO: add friends you dont have
    // TODO: last man standing
    return (
      <ExpansionPanel expanded={expanded} onChange={onExpand}>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <Typography className={classes.heading}>
            {goal.name} {goal.draft && '(Draft)'}
          </Typography>
          <Typography className={classes.secondaryHeading}>
            {elapsedDaysTillNow} / {goal.target}
          </Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <div className={classes.formWrapper}>
            <div className={classes.panelContainer}>
              <div className={classes.formWrapper}>
                <form className={classes.form}>
                  <TextField
                    id="name"
                    label="Name"
                    value={goal.name}
                    onChange={onRenameGoal}
                    className={classes.textField}
                    disabled={readOnly || !goal.draft}
                  />
                  <DateTimePicker
                    id="start-date"
                    label={goal.draft ? 'Challenge starting' : 'Challenge started'}
                    value={goal.started}
                    onChange={onChangeDate}
                    className={classes.dateTimePicker}
                    disabled={readOnly || !goal.draft}
                  />
                </form>
                <Typography>
                  <br />
                  {goal.target} days required to complete. If you fail you are out.
                  <br />
                  <br />
                  {!R.all(x => x.accepted)(participants) && (
                    <div>
                      Everyone has to agree to terms for the challenge to start.<br />
                      <br />
                    </div>
                  )}
                  <List dense>
                    {participants.map(x => {
                      const completedMinutes = x.failed
                        ? getElapsedMinutesBetween(goal.started, x.failed)
                        : null

                      const elapsedDaysBetweenStartedFailed = getElapsedDaysBetween(
                        goal.started,
                        x.failed,
                      )
                      const completedDays =
                        elapsedDaysBetweenStartedFailed > goal.target
                          ? goal.target
                          : elapsedDaysBetweenStartedFailed

                      const percentDone =
                        (completedMinutes >= goalInMinutes ? goalInMinutes : completedMinutes) /
                        goalInMinutes *
                        100

                      let status = ''

                      if (goal.draft) {
                        if (x.accepted) status = 'Accepted challenge'
                        else status = 'Waiting for response'
                      } else {
                        if (x.accepted) status = '👊 The Game is Afoot.'
                        if (x.failed) {
                          if (completedDays === 0) status = 'Failed challenge on the first day 🍤'
                          else
                            status = `Failed challenge after ${completedDays} ${completedDays === 1
                              ? 'day'
                              : 'days'} (${percentDone.toFixed(0)}%)`
                        }
                        if (x.finished) status = 'Completed challenge 🍭🐐'
                      }
                      return (
                        <ListItem key={x.email} dense className={classes.listItem}>
                          <Avatar src={x.avatarUrl} />
                          <ListItemText primary={x.displayName} secondary={status} dense />
                          {goal.draft && (
                            <ListItemSecondaryAction>
                              <Checkbox
                                onChange={onAcceptSharedGoal}
                                checked={x.accepted}
                                disabled={x.id !== currentUserId || x.accepted}
                              />
                            </ListItemSecondaryAction>
                          )}
                        </ListItem>
                      )
                    })}
                  </List>
                </Typography>
              </div>
            </div>
          </div>
        </ExpansionPanelDetails>
        <Divider />
        {!readOnly &&
          currentParticipant && (
            <ExpansionPanelActions>
              {((currentParticipant.accepted && currentParticipant.failed) ||
                goal.draft ||
                currentParticipant.finished) && (
                <Button dense onClick={onDelete}>
                  Abandon
                </Button>
              )}
              {currentParticipant.accepted &&
                !currentParticipant.failed &&
                !currentParticipant.finished &&
                !goal.draft && (
                  <Button dense onClick={onFail}>
                    Log Defeat
                  </Button>
                )}
              {!currentParticipant.accepted && (
                <Button color="primary" dense onClick={onAcceptSharedGoal}>
                  Accept
                </Button>
              )}
              {!goal.draft &&
                !currentParticipant.finished &&
                !currentParticipant.failed &&
                finished && (
                  <Button color="primary" key="finishBtn" dense onClick={onComplete}>
                    Finish
                  </Button>
                )}
            </ExpansionPanelActions>
          )}
      </ExpansionPanel>
    )
  }
}
export default withStyles(styles)(SharedGoalView)
