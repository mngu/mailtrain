'use strict';

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {translate} from 'react-i18next';
import {
    NavButton,
    requiresAuthenticatedUser,
    Title,
    withPageHelpers
} from '../../lib/page'
import {
    Button,
    ButtonRow,
    Dropdown,
    Form,
    FormSendMethod,
    InputField,
    TextArea,
    withForm
} from '../../lib/form';
import {withErrorHandling} from '../../lib/error-handling';
import {
    NamespaceSelect,
    validateNamespace
} from '../../lib/namespace';
import {DeleteModalDialog} from "../../lib/modals";

import {versafix} from "../../../../shared/mosaico-templates";
import {
    getTemplateTypes,
    getTemplateTypesOrder
} from "./helpers";

@translate()
@withForm
@withPageHelpers
@withErrorHandling
@requiresAuthenticatedUser
export default class CUD extends Component {
    constructor(props) {
        super(props);

        this.templateTypes = getTemplateTypes(props.t);

        this.typeOptions = [];
        for (const type of getTemplateTypesOrder()) {
            this.typeOptions.push({
                key: type,
                label: this.templateTypes[type].typeName
            });
        }

        this.state = {};

        this.initForm();
    }

    static propTypes = {
        action: PropTypes.string.isRequired,
        wizard: PropTypes.string,
        entity: PropTypes.object
    }

    componentDidMount() {
        if (this.props.entity) {
            this.getFormValuesFromEntity(this.props.entity, data => {
                this.templateTypes[data.type].afterLoad(data);
            });

        } else {
            const wizard = this.props.wizard;

            if (wizard === 'versafix') {
                this.populateFormValues({
                    name: '',
                    description: '',
                    namespace: mailtrainConfig.user.namespace,
                    type: 'html',
                    html: versafix
                });

            } else {
                this.populateFormValues({
                    name: '',
                    description: '',
                    namespace: mailtrainConfig.user.namespace,
                    type: 'html',
                    html: ''
                });
            }
        }
    }

    localValidateFormValues(state) {
        const t = this.props.t;

        if (!state.getIn(['name', 'value'])) {
            state.setIn(['name', 'error'], t('Name must not be empty'));
        } else {
            state.setIn(['name', 'error'], null);
        }

        if (!state.getIn(['type', 'value'])) {
            state.setIn(['type', 'error'], t('Type must be selected'));
        } else {
            state.setIn(['type', 'error'], null);
        }

        validateNamespace(t, state);
    }

    async submitAndStay() {
        await this.formHandleChangedError(async () => await this.doSubmit(true));
    }

    async submitAndLeave() {
        await this.formHandleChangedError(async () => await this.doSubmit(false));
    }

    async doSubmit(stay) {
        const t = this.props.t;

        let sendMethod, url;
        if (this.props.entity) {
            sendMethod = FormSendMethod.PUT;
            url = `rest/mosaico-templates/${this.props.entity.id}`
        } else {
            sendMethod = FormSendMethod.POST;
            url = 'rest/mosaico-templates'
        }

        this.disableForm();
        this.setFormStatusMessage('info', t('Saving ...'));

        const submitSuccessful = await this.validateAndSendFormValuesToURL(sendMethod, url, data => {
            this.templateTypes[data.type].beforeSave(data);
        });

        if (submitSuccessful) {
            if (stay) {
                await this.getFormValuesFromURL(`rest/mosaico-templates/${this.props.entity.id}`, data => {
                    this.templateTypes[data.type].afterLoad(data);
                });
                this.enableForm();
                this.setFormStatusMessage('success', t('Mosaico template saved'));
            } else {
                this.navigateToWithFlashMessage('/templates/mosaico', 'success', t('Mosaico template saved'));
            }
        } else {
            this.enableForm();
            this.setFormStatusMessage('warning', t('There are errors in the form. Please fix them and submit again.'));
        }
    }

    render() {
        const t = this.props.t;
        const isEdit = !!this.props.entity;
        const canDelete = isEdit && this.props.entity.permissions.includes('delete');

        const typeKey = this.getFormValue('type');
        let form = null;
        if (typeKey) {
            form = this.templateTypes[typeKey].getForm(this);
        }

        return (
            <div>
                {canDelete &&
                    <DeleteModalDialog
                        stateOwner={this}
                        visible={this.props.action === 'delete'}
                        deleteUrl={`rest/mosaico-templates/${this.props.entity.id}`}
                        cudUrl={`/templates/mosaico/${this.props.entity.id}/edit`}
                        listUrl="/templates/mosaico"
                        deletingMsg={t('Deleting Mosaico template ...')}
                        deletedMsg={t('Mosaico template deleted')}/>
                }

                <Title>{isEdit ? t('Edit Mosaico Template') : t('Create Mosaico Template')}</Title>

                <Form stateOwner={this} onSubmitAsync={::this.submitAndLeave}>
                    <InputField id="name" label={t('Name')}/>
                    <TextArea id="description" label={t('Description')}/>
                    <Dropdown id="type" label={t('Type')} options={this.typeOptions}/>
                    <NamespaceSelect/>

                    {form}

                    {isEdit ?
                        <ButtonRow>
                            <Button type="submit" className="btn-primary" icon="ok" label={t('Save and Stay')} onClickAsync={::this.submitAndStay}/>
                            <Button type="submit" className="btn-primary" icon="ok" label={t('Save and Leave')}/>
                            {canDelete &&
                                <NavButton className="btn-danger" icon="remove" label={t('Delete')} linkTo={`/templates/mosaico/${this.props.entity.id}/delete`}/>
                            }
                        </ButtonRow>
                    :
                        <ButtonRow>
                            <Button type="submit" className="btn-primary" icon="ok" label={t('Save')}/>
                        </ButtonRow>
                    }
                </Form>
            </div>
        );
    }
}