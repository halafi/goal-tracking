// @flow

import React, { PureComponent } from 'react'
import { compose } from 'redux'
import * as R from 'ramda'
import { withFirebase } from 'react-redux-firebase'
import moment from 'moment'
import ExpansionPanel, {
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  ExpansionPanelActions,
} from 'material-ui/ExpansionPanel'
import Grid from 'material-ui/Grid'
import Typography from 'material-ui/Typography'
import List, { ListItem, ListItemText, ListItemSecondaryAction } from 'material-ui/List'
import { withStyles } from 'material-ui/styles'
import Button from 'material-ui/Button'
import ExpandMoreIcon from 'material-ui-icons/ExpandMore'
import Divider from 'material-ui/Divider'
import Avatar from 'material-ui/Avatar'
import Checkbox from 'material-ui/Checkbox'
import TextField from 'material-ui/TextField'
import IconButton from 'material-ui/IconButton'
import PersonAddIcon from 'material-ui-icons/PersonAdd'
import GroupIcon from 'material-ui-icons/Group'
import type { SharedGoal, SharedGoalUser } from '../../../../../../../../common/records/SharedGoal'
import {
  getElapsedMinutesBetween,
  getElapsedDaysTillNow,
  getElapsedDaysBetween,
} from '../../../../../../../../common/services/dateTimeUtils'
import type { User, Users } from '../../../../../../../../common/records/Firebase/User'
import DateTimePicker from '../../../../../../../../common/components/DateTimePicker/DateTimePicker'

type Props = {
  firebase: any,
  goal: SharedGoal,
  users: Users,
  currentUserId: string,
  friends: Array<String>,
  onDelete: () => void,
  onChangeDate: (?number) => void,
  onChangeTarget: any => void,
  onChangeType: string => void,
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
  heading: {
    fontSize: theme.typography.pxToRem(15),
    flexBasis: '33.33%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
  },
  paddedText: {
    margin: '16px 0',
  },
  marginLeft: {
    marginLeft: '8px',
  },
})

type Participant = SharedGoalUser & User

const GOAL_TYPES = {
  ELIMINIATION: 'elimination',
  DURATION: 'duration',
}

class SharedGoalView extends PureComponent<Props> {
  render() {
    const {
      firebase,
      goal,
      users,
      currentUserId,
      friends,
      onDelete,
      onChangeDate,
      onChangeTarget,
      onChangeType,
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

    // FIXME
    const participants: Array<Participant> = goal.users
      .sort((a, b) => (a.id === currentUserId ? -1 : a.id.localeCompare(b.id)))
      .map(x => ({ ...x, ...users[x.id] }))

    const currentParticipant: ?Participant = R.compose(
      R.defaultTo(null),
      R.head,
      R.filter(R.propEq('id', currentUserId)),
    )(participants)

    const goalInMinutes: number = getElapsedMinutesBetween(
      goal.started,
      moment(goal.started)
        .add(goal.target, 'd')
        .valueOf(),
    )
    const everyoneAccepted = R.all(x => x.accepted)(participants)

    return (
      <ExpansionPanel expanded={expanded} onChange={onExpand}>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <Typography className={classes.heading}>
            <GroupIcon fontSize color="action" />
            <span className={classes.marginLeft}>
              {goal.name} {goal.draft && '(Draft)'}
            </span>
          </Typography>
          {!goal.draft && (
            <Typography className={classes.secondaryHeading}>
              {elapsedDaysTillNow} / {goal.target}
            </Typography>
          )}
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <Grid container>
            <Grid item xs={12}>
              <form>
                <Grid container direction="row" justify="flex-start" alignItems="center">
                  <Grid item>
                    <TextField
                      id="name"
                      label="Name"
                      value={goal.name}
                      onChange={onRenameGoal}
                      disabled={readOnly || !goal.draft}
                    />
                  </Grid>
                  <Grid item>
                    <DateTimePicker
                      id="start-date-shared"
                      label={goal.draft ? 'Start from' : 'Started'}
                      value={goal.started}
                      onChange={onChangeDate}
                      disabled={readOnly || !goal.draft}
                    />
                  </Grid>
                  <Grid item>
                    <TextField
                      id="select-challenge-type"
                      select
                      label="Type"
                      value={goal.type}
                      onChange={onChangeType}
                      SelectProps={{
                        native: true,
                      }}
                      disabled={readOnly || !goal.draft}
                    >
                      <option key={GOAL_TYPES.DURATION} value={GOAL_TYPES.DURATION}>
                        Duration
                      </option>
                      {/*<option key={GOAL_TYPES.ELIMINIATION} value={GOAL_TYPES.ELIMINIATION}>*/}
                      {/*Elimination*/}
                      {/*</option>*/}
                    </TextField>
                  </Grid>
                  {goal.type === GOAL_TYPES.DURATION && (
                    <Grid item>
                      <TextField
                        id="target"
                        label="Days"
                        value={goal.target}
                        onChange={onChangeTarget}
                        disabled={readOnly || !goal.draft}
                      />
                    </Grid>
                  )}
                </Grid>
              </form>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                <div className={classes.paddedText}>
                  {goal.type === GOAL_TYPES.DURATION ? (
                    <span>{goal.target} days required to complete. If you fail you are out.</span>
                  ) : (
                    <span>Last man standing wins. No second chances.</span>
                  )}
                </div>
                {!everyoneAccepted && (
                  <div className={classes.paddedText}>
                    Everyone has to agree to terms for the challenge to start.
                  </div>
                )}
                <List dense>
                  {participants.map(x => {
                    const completedMinutes = x.failed
                      ? getElapsedMinutesBetween(goal.started, x.failed)
                      : getElapsedMinutesBetween(goal.started, moment().valueOf())

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
                      if (x.accepted) status = 'Accepted'
                      else status = 'Waiting for response'
                    } else {
                      if (x.accepted) status = 'Active'
                      if (x.failed) {
                        if (completedDays === 0) status = 'Failed on the first day'
                        else
                          status = `Failed after ${completedDays} ${completedDays === 1
                            ? 'day'
                            : 'days'} (${percentDone.toFixed(0)}% done)`
                      }
                      if (x.finished) status = 'Finished'
                    }
                    return (
                      <ListItem key={x.email} dense className={classes.listItem}>
                        <Avatar src={x.photoURL || x.avatarUrl} />
                        <ListItemText
                          primary={x.userName || x.displayName}
                          secondary={status}
                          dense
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            disabled={
                              (currentParticipant && currentParticipant.id === x.id) ||
                              (friends && friends.includes(x.id))
                            }
                            onClick={() =>
                              firebase.updateProfile({
                                friends: friends ? friends.concat(x.id) : [x.id],
                              })}
                            aria-label="AddFriend"
                          >
                            <PersonAddIcon />
                          </IconButton>
                          {goal.draft && (
                            <Checkbox
                              onChange={onAcceptSharedGoal}
                              checked={x.accepted}
                              disabled={x.id !== currentUserId || x.accepted}
                            />
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                    )
                  })}
                </List>
              </Typography>
            </Grid>
          </Grid>
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
                    Fail
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
export default compose(withFirebase, withStyles(styles))(SharedGoalView)
